export type UserRole = "super" | "admin" | "viewer";

export function canManageContent(role?: string | null): boolean {
  return role === "super" || role === "admin";
}

export function getRoleLabel(role?: string | null): string {
  if (role === "super") return "超级管理员";
  if (role === "admin") return "管理员";
  return "普通用户";
}
