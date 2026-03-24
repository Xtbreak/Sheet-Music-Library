import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "next-auth";

// 扩展 Session 类型
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

async function getAdmin(username: string) {
  // 动态导入 Prisma，避免在 edge runtime 中加载
  const { prisma } = await import("./prisma");
  return prisma.admin.findUnique({
    where: { username },
    select: { id: true, username: true, password: true, role: true },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const admin = await getAdmin(credentials.username as string);

          if (!admin) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            admin.password
          );

          if (!isValid) {
            return null;
          }

          return {
            id: admin.id,
            name: admin.username,
            email: null,
            username: admin.username,
            role: admin.role,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as Record<string, unknown>).username as string;
        token.role = (user as Record<string, unknown>).role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});