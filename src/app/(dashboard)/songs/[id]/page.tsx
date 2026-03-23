"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Sheet {
  id: string;
  name: string | null;
  fileUrl: string | null;
  notes: string | null;
  sortOrder: number;
}

interface Song {
  id: string;
  title: string;
  lyrics: string;
  createdAt: string;
  category: { id: string; name: string } | null;
  sheets: Sheet[];
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSheetForm, setShowSheetForm] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Sheet | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sheetForm, setSheetForm] = useState({
    name: "",
    fileUrl: "",
    notes: "",
    sortOrder: 0,
  });

  const fetchSong = async () => {
    try {
      const res = await fetch(`/api/songs/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setSong(data);
      } else {
        alert("歌曲不存在");
        router.push("/songs");
      }
    } catch (error) {
      console.error("获取歌曲详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSong();
  }, [params.id]);

  const openAddSheetForm = () => {
    setEditingSheet(null);
    setSheetForm({
      name: "",
      fileUrl: "",
      notes: "",
      sortOrder: 0,
    });
    setShowSheetForm(true);
  };

  const openEditSheetForm = (sheet: Sheet) => {
    setEditingSheet(sheet);
    setSheetForm({
      name: sheet.name || "",
      fileUrl: sheet.fileUrl || "",
      notes: sheet.notes || "",
      sortOrder: sheet.sortOrder,
    });
    setShowSheetForm(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      } else {
        const data = await res.json();
        alert(data.error || "上传失败");
        return null;
      }
    } catch (error) {
      console.error("上传图片失败:", error);
      alert("上传图片失败");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      setSheetForm({ ...sheetForm, fileUrl: url });
    }
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = await uploadImage(file);
    if (url) {
      setSheetForm({ ...sheetForm, fileUrl: url });
    }
  };

  const handleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sheetForm.fileUrl) {
      alert("请上传乐谱图片");
      return;
    }

    try {
      const url = editingSheet
        ? `/api/sheets/${editingSheet.id}`
        : "/api/sheets";
      const method = editingSheet ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sheetForm,
          songId: params.id,
          fileUrl: sheetForm.fileUrl || null,
        }),
      });

      if (res.ok) {
        setShowSheetForm(false);
        fetchSong();
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存乐谱失败:", error);
      alert("保存失败");
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!confirm("确定要删除该乐谱吗？")) return;

    try {
      const res = await fetch(`/api/sheets/${sheetId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSong();
      }
    } catch (error) {
      console.error("删除乐谱失败:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  if (!song) {
    return <div className="text-center py-10">歌曲不存在</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回歌曲列表
        </button>
      </div>

      {/* 歌曲信息 */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{song.title}</h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 mb-4">
          <div className="flex flex-wrap gap-4">
            {song.category && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                分类: {song.category.name}
              </span>
            )}
          </div>
          {session && (
            <Link
              href={`/songs/${song.id}/edit`}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              编辑
            </Link>
          )}
        </div>
      </div>

      {/* 乐谱列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">乐谱 ({song.sheets.length})</h2>
          {session && (
            <button
              onClick={openAddSheetForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              添加乐谱
            </button>
          )}
        </div>

        {song.sheets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无乐谱，请添加</p>
        ) : (
          <div className="space-y-4">
            {song.sheets.map((sheet) => (
              <div
                key={sheet.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {sheet.name || "曲谱"}
                    </h3>
                    {sheet.notes && (
                      <p className="text-sm text-gray-500 mt-2">{sheet.notes}</p>
                    )}
                  </div>
                  {session && (
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => openEditSheetForm(sheet)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
                {sheet.fileUrl && (
                  <div className="mt-3 relative group inline-block w-full">
                    <img
                      src={sheet.fileUrl}
                      alt={sheet.name || "曲谱"}
                      className="max-w-full rounded border border-gray-200"
                    />
                    <a
                      href={sheet.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title="查看原图"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 乐谱表单弹窗 */}
      {showSheetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingSheet ? "编辑乐谱" : "添加乐谱"}
            </h2>
            <form onSubmit={handleSheetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  乐谱名称
                </label>
                <input
                  type="text"
                  value={sheetForm.name}
                  onChange={(e) =>
                    setSheetForm({ ...sheetForm, name: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={'可选，默认显示"曲谱"'}
                />
              </div>

              {/* 图片上传区域 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  乐谱图片 *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {sheetForm.fileUrl ? (
                    <div className="relative">
                      <img
                        src={sheetForm.fileUrl}
                        alt="乐谱预览"
                        className="max-h-64 mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSheetForm({ ...sheetForm, fileUrl: "" });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 mb-2">
                        {uploading ? (
                          <span>上传中...</span>
                        ) : (
                          <>
                            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m0 0h8m-8 0v-8m0 8h8" />
                            </svg>
                            <span>点击或拖拽上传乐谱图片</span>
                            <span className="text-xs text-gray-400">支持 JPG、PNG、WebP、GIF，最大 5MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  备注
                </label>
                <textarea
                  value={sheetForm.notes}
                  onChange={(e) =>
                    setSheetForm({ ...sheetForm, notes: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="可选，记录演奏要点、转调说明等"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSheetForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "上传中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
