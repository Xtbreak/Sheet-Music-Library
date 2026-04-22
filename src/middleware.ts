import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/roles";

// 仅检查页面路由的认证，API 路由由各自的 handler 自行处理认证
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径：登录页、歌曲浏览页（列表、详情）
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/songs" ||
    /^\/songs\/[^/]+$/.test(pathname);

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 使用 NextAuth 的 auth() 验证 session
  const session = await auth();

  // 未登录 -> 重定向到登录页
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 普通用户仅可浏览公开页面（列表与详情）
  if (!canManageContent(session.user?.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// 排除所有 API 路由和静态资源，避免干扰 NextAuth 的 /api/auth/* 请求
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|uploads).*)"],
};
