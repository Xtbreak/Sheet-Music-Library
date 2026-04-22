import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 获取管理员列表（仅超级管理员）
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "super") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("获取管理员列表失败:", error);
    return NextResponse.json({ error: "获取管理员列表失败" }, { status: 500 });
  }
}

// 创建管理员（仅超级管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "super") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
  const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
    }

    const normalizedRole = role === "viewer" ? "viewer" : "admin";

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        role: normalizedRole,
      },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error: unknown) {
    console.error("创建管理员失败:", error);
    const msg = error instanceof Error ? error.message : "创建管理员失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
