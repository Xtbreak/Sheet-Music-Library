"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Admin {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function AdminsPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [oldPassword, setOldPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      console.error("获取管理员失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 打开添加表单
  const openAddForm = () => {
    setEditingAdmin(null);
    setFormData({ username: "", password: "" });
    setShowForm(true);
  };

  // 打开编辑表单
  const openEditForm = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({ username: admin.username, password: "" });
    setOldPassword("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingAdmin) {
        // 编辑模式
        const updateData: { username?: string; password?: string } = {};

        // 如果用户名改变了
        if (formData.username !== editingAdmin.username) {
          updateData.username = formData.username;
        }

        // 如果填写了新密码
        if (formData.password) {
          if (formData.password.length < 6) {
            alert("密码至少6位");
            setSaving(false);
            return;
          }
          updateData.password = formData.password;
        }

        // 如果没有任何修改
        if (Object.keys(updateData).length === 0) {
          setShowForm(false);
          setSaving(false);
          return;
        }

        // 如果修改自己的密码，需要验证原密码
        if (editingAdmin.id === session?.user?.id && formData.password) {
          setShowPasswordConfirm(true);
          setSaving(false);
          return;
        }

        // 超级管理员修改其他人，直接调用 API
        const res = await fetch(`/api/admins/${editingAdmin.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (res.ok) {
          setShowForm(false);
          fetchAdmins();
        } else {
          const data = await res.json();
          alert(data.error || "修改失败");
        }
      } else {
        // 添加模式
        if (!formData.username || !formData.password) {
          alert("请填写用户名和密码");
          setSaving(false);
          return;
        }

        if (formData.password.length < 6) {
          alert("密码至少6位");
          setSaving(false);
          return;
        }

        const res = await fetch("/api/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setShowForm(false);
          fetchAdmins();
        } else {
          const data = await res.json();
          alert(data.error || "创建失败");
        }
      }
    } catch (error) {
      console.error("操作失败:", error);
      alert("操作失败");
    } finally {
      setSaving(false);
    }
  };

  // 确认原密码后修改
  const handlePasswordConfirm = async () => {
    if (!oldPassword) {
      alert("请输入原密码");
      return;
    }

    setSaving(true);
    try {
      // 先验证原密码并修改密码
      const res = await fetch("/api/admins/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "原密码错误");
        setSaving(false);
        return;
      }

      // 密码修改成功，再修改用户名（如果有）
      if (formData.username !== editingAdmin?.username) {
        await fetch(`/api/admins/${editingAdmin?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formData.username }),
        });
      }

      alert("修改成功");
      setShowPasswordConfirm(false);
      setShowForm(false);
      fetchAdmins();
    } catch (error) {
      console.error("修改失败:", error);
      alert("修改失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该管理员吗？")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除管理员失败:", error);
      alert("删除失败");
    }
  };

  if (!session) return null;

  const isSuper = session.user.role === "super";

  if (!isSuper) {
    return <div className="text-center py-10 text-gray-500">无权限访问</div>;
  }

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          添加管理员
        </button>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingAdmin ? "编辑管理员" : "添加管理员"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  用户名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingAdmin ? "新密码（留空则不修改）" : "密码 *"}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={editingAdmin ? "留空则不修改密码" : "至少6位"}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 确认原密码弹窗 */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">确认原密码</h2>
            <p className="text-sm text-gray-600 mb-4">
              修改自己的密码需要验证原密码
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  原密码 *
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordConfirm(false);
                    setOldPassword("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handlePasswordConfirm}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "确认中..." : "确认修改"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 管理员列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* 手机端：卡片列表 */}
        <div className="sm:hidden divide-y divide-gray-200">
          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-10">暂无管理员</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="p-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{admin.username}</span>
                    {admin.id === session.user.id && (
                      <span className="text-xs text-gray-400">（当前）</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {admin.role === "super" ? (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">超级管理员</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">管理员</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 ml-2 flex-shrink-0">
                  <button
                    onClick={() => openEditForm(admin)}
                    className="text-sm text-blue-600"
                  >
                    编辑
                  </button>
                  {admin.id !== session.user.id && (
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="text-sm text-red-600"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 桌面端：表格 */}
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    暂无管理员
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.username}
                      {admin.id === session.user.id && (
                        <span className="ml-2 text-xs text-gray-400">（当前）</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {admin.role === "super" ? (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">超级管理员</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">管理员</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                      <button
                        onClick={() => openEditForm(admin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </button>
                      {admin.id !== session.user.id && (
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}