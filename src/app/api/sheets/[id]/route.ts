import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const { id } = await params;
    const body = await request.json();
    const { name, fileUrl, notes, sortOrder } = body;

    const sheet = await prisma.sheet.update({
      where: { id },
      data: {
        name,
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
