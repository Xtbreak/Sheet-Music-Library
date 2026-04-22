"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { KEY_SIGNATURE_OPTIONS, normalizeKeySignature } from "@/lib/key-signatures";

interface Category {
  id: string;
  name: string;
}

interface SheetForm {
  id?: string;
  name: string;
  keySignature: string;
  fileUrl: string;
  notes: string;
  sortOrder: number;
  _deleted?: boolean;
  _isNew?: boolean;
}

export default function EditSongPage() {
  const params = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [formData, setFormData] = useState({
    title: "",
    lyrics: "",
    categoryId: "",
  });

  const [sheets, setSheets] = useState<SheetForm[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSong();
  }, [params.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("获取分类失败:", error);
    }
  };

  const fetchSong = async () => {
    try {
      const res = await fetch(`/api/songs/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title,
          lyrics: data.lyrics || "",
          categoryId: data.categoryId || "",
        });
        if (data.sheets) {
          setSheets(
            data.sheets.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: (s.name as string) || "",
              keySignature: normalizeKeySignature((s.keySignature as string) || "") || "",
              fileUrl: (s.fileUrl as string) || "",
              notes: (s.notes as string) || "",
              sortOrder: (s.sortOrder as number) || 0,
            }))
          );
        }
      }
    } catch (error) {
      console.error("获取歌曲失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSheet = () => {
    setSheets([
      ...sheets,
      {
        name: "",
        keySignature: "",
        fileUrl: "",
        notes: "",
        sortOrder: sheets.length,
        _isNew: true,
      },
    ]);
  };

  const removeSheet = (index: number) => {
    const sheet = sheets[index];
    if (sheet.id) {
      setSheets(sheets.map((s, i) => (i === index ? { ...s, _deleted: true } : s)));
    } else {
      setSheets(sheets.filter((_, i) => i !== index));
    }
  };

  const restoreSheet = (index: number) => {
    setSheets(sheets.map((s, i) => (i === index ? { ...s, _deleted: false } : s)));
  };

  const updateSheet = (index: number, data: Partial<SheetForm>) => {
    setSheets(sheets.map((s, i) => (i === index ? { ...s, ...data } : s)));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
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

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      updateSheet(index, { fileUrl: url });
    }
    e.target.value = "";
  };

  const handleDrop = async (index: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = await uploadImage(file);
    if (url) {
      updateSheet(index, { fileUrl: url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("请输入歌曲标题");
      return;
    }

    setSaving(true);

    try {
      const songRes = await fetch(`/api/songs/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId || null,
        }),
      });

      if (!songRes.ok) {
        const data = await songRes.json();
        alert(data.error || "保存失败");
        return;
      }

      for (const sheet of sheets) {
        if (sheet._deleted && sheet.id) {
          await fetch(`/api/sheets/${sheet.id}`, { method: "DELETE" });
        } else if (sheet._isNew && sheet.fileUrl) {
          await fetch("/api/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              songId: params.id,
              name: sheet.name || null,
              keySignature: sheet.keySignature || null,
              fileUrl: sheet.fileUrl || null,
              notes: sheet.notes || null,
              sortOrder: sheet.sortOrder,
            }),
          });
        } else if (sheet.id && !sheet._deleted) {
          await fetch(`/api/sheets/${sheet.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: sheet.name || null,
              keySignature: sheet.keySignature || null,
              fileUrl: sheet.fileUrl || null,
              notes: sheet.notes || null,
              sortOrder: sheet.sortOrder,
            }),
          });
        }
      }

      // 保存成功，返回上一页（保持之前的状态）
      router.back();
    } catch (error) {
      console.error("保存歌曲失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑歌曲</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              歌曲标题 *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              分类
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 曲谱区域 */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">曲谱</h2>
              <button
                type="button"
                onClick={addSheet}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + 添加曲谱
              </button>
            </div>

            {sheets.length === 0 && (
              <p className="text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                暂无曲谱，点击「添加曲谱」按钮上传
              </p>
            )}

            <div className="space-y-6">
              {sheets.map((sheet, index) => (
                <div
                  key={sheet.id || index}
                  className={`border rounded-lg p-4 ${sheet._deleted ? "bg-red-50 opacity-60" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-800">
                      曲谱 {index + 1}
                      {sheet._deleted && (
                        <span className="text-red-500 text-sm ml-2">（待删除）</span>
                      )}
                    </h3>
                    <div className="flex space-x-3">
                      {sheet._deleted ? (
                        <button
                          type="button"
                          onClick={() => restoreSheet(index)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          恢复
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeSheet(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>

                  {!sheet._deleted && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          曲谱名称
                        </label>
                        <input
                          type="text"
                          value={sheet.name}
                          onChange={(e) =>
                            updateSheet(index, { name: e.target.value })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder={'可选，默认显示"曲谱"'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          曲调
                        </label>
                        <select
                          value={sheet.keySignature}
                          onChange={(e) =>
                            updateSheet(index, { keySignature: e.target.value })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          {KEY_SIGNATURE_OPTIONS.map((option) => (
                            <option key={option.value || "empty"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 图片上传 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          曲谱图片
                        </label>
                        <input
                          ref={(el) => { fileInputRefs.current[index] = el; }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(index, e)}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRefs.current[index]?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(index, e)}
                          className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          {sheet.fileUrl ? (
                            <div className="relative">
                              <img
                                src={sheet.fileUrl}
                                alt="曲谱预览"
                                className="w-full h-56 object-contain bg-white mx-auto rounded border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSheet(index, { fileUrl: "" });
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              {uploading ? (
                                <span>上传中...</span>
                              ) : (
                                <>
                                  <span className="text-sm">点击或拖拽上传曲谱图片</span>
                                  <span className="block text-xs mt-1">JPG、PNG、WebP，最大 5MB</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 备注 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          备注
                        </label>
                        <textarea
                          value={sheet.notes}
                          onChange={(e) =>
                            updateSheet(index, { notes: e.target.value })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={2}
                          placeholder="演奏要点、转调说明等"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
