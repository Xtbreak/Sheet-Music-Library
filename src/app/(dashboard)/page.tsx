"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Song {
  id: string;
  title: string;
  createdAt: string;
  category: { id: string; name: string } | null;
  _count?: { sheets: number };
}

interface Category {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("获取分类失败:", error);
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", "20");
      if (keyword) params.set("keyword", keyword);
      if (categoryId) params.set("categoryId", categoryId);

      const res = await fetch(`/api/songs?${params}`);
      const data = await res.json();
      setSongs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("获取歌曲列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [page, categoryId]);

  const handleSearch = () => {
    setPage(1);
    fetchSongs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该歌曲吗？")) return;

    try {
      const res = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSongs();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除歌曲失败:", error);
      alert("删除失败");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">歌曲列表</h1>
        {session && (
          <Link
            href="/songs/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            添加歌曲
          </Link>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="搜索歌名、歌词、作者..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
          />
          <div className="flex gap-2">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="flex-1 sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 歌曲列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10">加载中...</div>
        ) : songs.length === 0 ? (
          <p className="text-gray-500 text-center py-10">暂无歌曲，请添加</p>
        ) : (
          <>
            {/* 手机端：卡片列表 */}
            <div className="sm:hidden divide-y divide-gray-200">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="block p-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                  onClick={() => window.location.href = `/songs/${song.id}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 mr-2">
                      {song.title}
                    </h3>
                    {session && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Link
                          href={`/songs/${song.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }}
                          className="text-xs text-red-600"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    {song.category?.name && (
                      <span>{song.category.name}</span>
                    )}
                    {song._count?.sheets ? (
                      <>
                        <span>·</span>
                        <span>{song._count.sheets}谱</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* 桌面端：表格 */}
            <div className="hidden sm:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      歌曲标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      曲谱数
                    </th>
                    {session && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {songs.map((song) => (
                    <tr key={song.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/songs/${song.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {song.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {song.category?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {song._count?.sheets || 0}
                      </td>
                      {session && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            href={`/songs/${song.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            查看
                          </Link>
                          <Link
                            href={`/songs/${song.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            编辑
                          </Link>
                          <button
                            onClick={() => handleDelete(song.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
