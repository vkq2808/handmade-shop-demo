import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/customAxios.js";
import { useToast } from "../../contexts/toast.context.jsx";
import { FaPlus, FaSearch, FaEdit, FaEyeSlash, FaUndo } from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";

const Categories = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchCats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data || []);
    } catch (e) {
      console.error("Fetch categories error:", e);
      toast.error(e.response?.data?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/categories", { name, description });
      setName("");
      setDescription("");
      fetchCats();
      toast.success("Đã thêm danh mục");
    } catch (e) {
      console.error("Create category error:", e);
      toast.error(e.response?.data?.message || "Tạo danh mục thất bại");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await api.put(`/categories/${id}`, payload);
      fetchCats();
      toast.success("Đã cập nhật danh mục");
    } catch (e) {
      console.error("Update category error:", e);
      toast.error(e.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Ẩn danh mục này?")) return;
    await handleUpdate(id, { isActive: false });
  };

  const handleRestore = async (id) => {
    await handleUpdate(id, { isActive: true });
  };

  const filtered = useMemo(() => {
    if (!q) return categories;
    const key = q.toLowerCase();
    return categories.filter((c) =>
      (c.name || "").toLowerCase().includes(key) || (c.description || "").toLowerCase().includes(key)
    );
  }, [categories, q]);

  const filteredActive = useMemo(() => filtered.filter((c) => c.isActive !== false), [filtered]);
  const filteredInactive = useMemo(() => filtered.filter((c) => c.isActive === false), [filtered]);

  const openEdit = (cat) => {
    setEditing(cat);
    setEditName(cat.name || "");
    setEditDescription(cat.description || "");
    setEditOpen(true);
  };

  const submitEdit = async (e) => {
    e?.preventDefault?.();
    if (!editing) return;
    await handleUpdate(editing._id, { name: editName, description: editDescription });
    setEditOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="w-60 rounded-full border-2 border-primary px-9 py-2 text-sm outline-none focus:ring-2 ring-handmade"
              placeholder="Tìm kiếm..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn-outline flex items-center gap-2" onClick={fetchCats}>
            <FaRotateRight /> Làm mới
          </button>
          <span className="text-sm text-muted">Tổng: {categories.length}</span>
        </div>
      </div>

      <form onSubmit={handleCreate} className="card-stable grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm">Tên danh mục</label>
          <input className="w-full rounded border px-3 py-2" placeholder="Ví dụ: Hoa len" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm">Mô tả</label>
          <input className="w-full rounded border px-3 py-2" placeholder="Mô tả ngắn (tuỳ chọn)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="sm:col-span-4 flex items-center justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2"><FaPlus /> Thêm danh mục</button>
        </div>
      </form>

      {/* Active categories */}
      <div className="card-stable p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Danh mục đang hoạt động ({filteredActive.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-parchment/60">
              <tr className="text-left">
                <th className="p-3 text-sm font-semibold">Tên</th>
                <th className="p-3 text-sm font-semibold">Mô tả</th>
                <th className="p-3 text-sm font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-4 w-40 animate-pulse rounded bg-parchment" /></td>
                    <td className="p-3"><div className="h-4 w-64 animate-pulse rounded bg-parchment" /></td>
                    <td className="p-3 text-right"><div className="h-8 w-28 ml-auto animate-pulse rounded bg-parchment" /></td>
                  </tr>
                ))
              ) : filteredActive.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-sm text-muted" colSpan={3}>Không có danh mục hoạt động</td>
                </tr>
              ) : (
                filteredActive.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-parchment/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-sm text-gray-700">{c.description}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-outline flex items-center gap-2" onClick={() => openEdit(c)}>
                          <FaEdit /> Sửa
                        </button>
                        <button className="btn-outline flex items-center gap-2" onClick={() => handleDeactivate(c._id)}>
                          <FaEyeSlash /> Ẩn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive categories */}
      <div className="card-stable p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Danh mục đã ẩn ({filteredInactive.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-parchment/60">
              <tr className="text-left">
                <th className="p-3 text-sm font-semibold">Tên</th>
                <th className="p-3 text-sm font-semibold">Mô tả</th>
                <th className="p-3 text-sm font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-4 w-40 animate-pulse rounded bg-parchment" /></td>
                    <td className="p-3"><div className="h-4 w-64 animate-pulse rounded bg-parchment" /></td>
                    <td className="p-3 text-right"><div className="h-8 w-28 ml-auto animate-pulse rounded bg-parchment" /></td>
                  </tr>
                ))
              ) : filteredInactive.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-sm text-muted" colSpan={3}>Không có danh mục đã ẩn</td>
                </tr>
              ) : (
                filteredInactive.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-parchment/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-sm text-gray-700">{c.description}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-outline flex items-center gap-2" onClick={() => handleRestore(c._id)}>
                          <FaUndo /> Khôi phục
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chỉnh sửa danh mục</h3>
              <button className="btn-outline" onClick={() => setEditOpen(false)}>Đóng</button>
            </div>
            <form onSubmit={submitEdit} className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-sm">Tên</label>
                <input className="w-full rounded border px-3 py-2" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">Mô tả</label>
                <input className="w-full rounded border px-3 py-2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" className="btn-outline" onClick={() => setEditOpen(false)}>Huỷ</button>
                <button type="submit" className="btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
