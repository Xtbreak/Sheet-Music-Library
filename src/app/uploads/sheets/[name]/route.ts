import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

// 兼容旧路径 /uploads/sheets/xxx
// 同时查找 public/uploads/sheets 和 uploads 目录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    // 优先查找 public/uploads/sheets（旧位置），然后查找 uploads/sheets（新位置）
    const oldPath = join(process.cwd(), "public", "uploads", "sheets", name);
    const newPath = join(process.cwd(), "uploads", "sheets", name);

    let filePath: string;
    try {
      await stat(oldPath);
      filePath = oldPath;
    } catch {
      await stat(newPath);
      filePath = newPath;
    }

    const fileStat = await stat(filePath);
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
