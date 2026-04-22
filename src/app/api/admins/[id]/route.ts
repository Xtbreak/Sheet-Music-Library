import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 修改管理员信息（仅超级管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "super") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
  const { username, password, role } = body;

    // 检查用户名是否已存在
    if (username) {
      const existing = await prisma.admin.findFirst({
        where: {
          username,
          NOT: { id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
      }
    }

    const updateData: { username?: string; password?: string; role?: string } = {};
    if (username) updateData.username = username;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role === "admin" || role === "viewer") {
      if (session.user.id === id) {
        return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
      }
      updateData.role = role;
    }

    await prisma.admin.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("修改管理员失败:", error);
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }
}

// 删除管理员（仅超级管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "super") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
    }

    await prisma.admin.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除管理员失败:", error);
    return NextResponse.json({ error: "删除管理员失败" }, { status: 500 });
  }
}