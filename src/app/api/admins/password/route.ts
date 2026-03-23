import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 修改自己的密码
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少6位" }, { status: 400 });
    }

    // 获取当前管理员
    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "原密码错误" }, { status: 400 });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "密码修改成功" });
  } catch (error) {
    console.error("修改密码失败:", error);
    return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
  }
}