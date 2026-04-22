import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeKeySignature } from "@/lib/key-signatures";
import { canManageContent } from "@/lib/roles";

// 创建乐谱
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
    const { songId, name, keySignature, fileUrl, notes, sortOrder } = body;

    if (!songId || !fileUrl) {
      return NextResponse.json(
        { error: "请上传乐谱图片" },
        { status: 400 }
      );
    }

    const sheet = await prisma.sheet.create({
      data: {
        songId,
        name,
        keySignature: normalizeKeySignature(keySignature),
        fileUrl,
        notes,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(sheet, { status: 201 });
  } catch (error: unknown) {
    console.error("创建乐谱失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "创建乐谱失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
