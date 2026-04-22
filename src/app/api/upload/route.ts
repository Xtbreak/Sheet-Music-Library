import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    if (!canManageContent(session.user.role)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP、GIF 格式的图片" },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
    }

    // 生成唯一文件名
    const ext = file.name.split(".").pop() || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = join(process.cwd(), "uploads", "sheets");
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);

    // 写入文件
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 返回可访问的 URL 路径（通过 API 路由访问）
    const url = `/api/files/sheets/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error: unknown) {
    console.error("文件上传失败:", error);
    const errorMessage =
      error instanceof Error ? error.message : "文件上传失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
