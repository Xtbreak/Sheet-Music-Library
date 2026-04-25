import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeKeySignature } from "@/lib/key-signatures";
import { canManageContent } from "@/lib/roles";

// 更新乐谱
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
    const { name, keySignature, fileUrl, notes, sortOrder } = body;

    const normalizedKeySignature = normalizeKeySignature(keySignature);
    if (!normalizedKeySignature) {
      return NextResponse.json({ error: "请选择曲调" }, { status: 400 });
    }

    const sheet = await prisma.sheet.update({
      where: { id },
      data: {
        name,
        keySignature: normalizedKeySignature,
        fileUrl,
        notes,
        sortOrder,
      },
    });

    return NextResponse.json(sheet);
  } catch (error: unknown) {
    console.error("更新乐谱失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "更新乐谱失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 删除乐谱
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

    await prisma.sheet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除乐谱失败:", error);
    return NextResponse.json({ error: "删除乐谱失败" }, { status: 500 });
  }
}
