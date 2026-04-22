import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/roles";

// 获取分类列表
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { songs: true },
        },
      },
    });

    // 按 localeCompare 排序（中文按拼音、英文按字母）
    categories.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类失败:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

// 创建分类
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("创建分类失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "创建分类失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}