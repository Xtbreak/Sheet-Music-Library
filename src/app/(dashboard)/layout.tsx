"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { canManageContent } from "@/lib/roles";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthLoading = status === "loading";

  const isSuper = session?.user?.role === "super";
  const canManage = canManageContent(session?.user?.role);

  const navItems = isAuthLoading
    ? []
    : session && canManage
    ? [
        { href: "/", label: "歌曲管理" },
        { href: "/categories", label: "分类管理" },
        ...(isSuper ? [{ href: "/admins", label: "管理员" }] : []),
      ]
    : [{ href: "/", label: "歌曲" }];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <Link href="/" className="text-base sm:text-xl font-bold text-gray-900 hover:text-blue-600 truncate block max-w-[120px] sm:max-w-none">
                  诗歌库
                </Link>
              </div>
              <nav className="ml-3 sm:ml-6 flex space-x-1 sm:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthLoading ? (
                <span className="text-xs sm:text-sm text-gray-400">加载中...</span>
              ) : session ? (
                <>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {session?.user?.username || session?.user?.name || "已登录"}
                  </span>
                  <button
                    onClick={() =>
                      signOut({ redirect: false }).then(() =>
                        router.push("/login")
                      )
                    }
                    className="text-xs sm:text-sm text-red-600 hover:text-red-800"
                  >
                    退出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}
