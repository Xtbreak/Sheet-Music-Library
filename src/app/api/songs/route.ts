import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pinyin } from "pinyin-pro";
import { normalizeKeySignature } from "@/lib/key-signatures";
import { canManageContent } from "@/lib/roles";

// 获取歌曲列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const keyword = searchParams.get("keyword") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const keySignature = normalizeKeySignature(searchParams.get("keySignature"));

    const where = {
      ...(categoryId && { categoryId }),
      ...(keySignature && {
        sheets: {
          some: {
            keySignature,
          },
        },
      }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword } },
          { titlePinyin: { contains: keyword.toLowerCase() } },
          { lyricsPlain: { contains: keyword } },
        ],
      }),
    };

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where: where as never,
        include: {
          category: true,
          _count: {
            select: { sheets: true },
          },
        },
        orderBy: { title: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.song.count({ where: where as never }),
    ]);

    return NextResponse.json({
      data: songs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取歌曲列表失败:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "获取歌曲列表失败", detail: msg }, { status: 500 });
  }
}

// 创建歌曲
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    if (!canManageContent(session.user.role)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { title, lyrics, categoryId } = body;

    if (!title) {
      return NextResponse.json({ error: "歌曲标题不能为空" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "请选择分类" }, { status: 400 });
    }

    // 生成拼音
    const titlePinyin = pinyin(title, { toneType: "none", type: "array" }).join("");

    // 去除歌词中的 HTML 标签，用于搜索
    const lyricsPlain = lyrics ? lyrics.replace(/<[^>]*>/g, "") : null;

    const song = await prisma.song.create({
      data: {
        title,
        titlePinyin,
        lyrics: lyrics || "",
        lyricsPlain,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error: unknown) {
    console.error("创建歌曲失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "创建歌曲失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
