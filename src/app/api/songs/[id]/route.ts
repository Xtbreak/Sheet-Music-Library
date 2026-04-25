import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pinyin } from "pinyin-pro";
import { canManageContent } from "@/lib/roles";

// 获取单个歌曲详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        category: true,
        sheets: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!song) {
      return NextResponse.json({ error: "歌曲不存在" }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error("获取歌曲详情失败:", error);
    return NextResponse.json({ error: "获取歌曲详情失败" }, { status: 500 });
  }
}

// 更新歌曲
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    if (!canManageContent(session.user.role)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, lyrics, categoryId } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "请选择分类" }, { status: 400 });
    }

    // 生成拼音
    const titlePinyin = title
      ? pinyin(title, { toneType: "none", type: "array" }).join("")
      : undefined;

    // 去除歌词中的 HTML 标签
    const lyricsPlain = lyrics !== undefined ? lyrics.replace(/<[^>]*>/g, "") : undefined;

    const song = await prisma.song.update({
      where: { id },
      data: {
        title,
        titlePinyin,
        lyrics,
        lyricsPlain,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(song);
  } catch (error: unknown) {
    console.error("更新歌曲失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "更新歌曲失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 删除歌曲
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    if (!canManageContent(session.user.role)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    // 先删除关联的曲谱
    await prisma.sheet.deleteMany({
      where: { songId: id },
    });

    // 再删除歌曲
    await prisma.song.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除歌曲失败:", error);
    return NextResponse.json({ error: "删除歌曲失败" }, { status: 500 });
  }
}
