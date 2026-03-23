import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

// 创建初始管理员（仅在没有管理员时可用）
export async function GET() {
  try {
    const adminCount = await prisma.admin.count();
    if (adminCount > 0) {
      return NextResponse.json({
        error: "已存在管理员，无法通过此接口创建",
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
        role: "super",
      },
    });

    return NextResponse.json({
      success: true,
      message: "管理员创建成功",
      username: "admin",
      password: "admin123",
      note: "请登录后立即修改密码",
    });
  } catch (error) {
    console.error("创建管理员失败:", error);
    return NextResponse.json({ error: "创建管理员失败" }, { status: 500 });
  }
}
