import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/customAxios.js";
import { useToast } from "../../contexts/toast.context.jsx";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";

const Imports = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [form, setForm] = useState({ product: "", quantity: 0, unitPrice: 0, source: "", note: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: 0, unitPrice: 0, source: "", note: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [proRes, impRes] = await Promise.all([
        api.get("/products", { params: { page: 1, limit: 999 } }),
        api.get("/imports", { params: { page, limit, product: filterProduct || undefined, includeDeleted } }),
      ]);
      setProducts(proRes.data.products || []);
      setItems(impRes.data.items || []);
      setTotal(impRes.data.total || 0);
      setTotalPages(impRes.data.totalPages || 1);
      if (impRes.data.page) setPage(impRes.data.page);
    } catch (e) {
      console.error("Fetch imports error:", e);
      toast.error(e.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filterProduct, includeDeleted]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) };
      await api.post("/imports", payload);
      setForm({ product: "", quantity: 0, unitPrice: 0, source: "", note: "" });
      setPage(1);
      fetchAll();
      toast.success("Đã tạo phiếu nhập và cập nhật tồn kho");
    } catch (e) {
      console.error("Create import error:", e);
      toast.error(e.response?.data?.message || "Tạo phiếu nhập thất bại");
    }
  };

  const openEdit = (it) => {
    setEditing(it);
    setEditForm({ quantity: it.quantity || 0, unitPrice: it.unitPrice || 0, source: it.source || "", note: it.note || "" });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = { ...editForm, quantity: Number(editForm.quantity), unitPrice: Number(editForm.unitPrice) };
      const res = await api.put(`/imports/${editing._id}`, payload);
      toast.success("Đã cập nhật phiếu nhập");
      setEditing(null);
      fetchAll();
    } catch (e) {
      console.error("Update import error:", e);
      toast.error(e.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleSoftDelete = async (it) => {
    const reason = prompt("Lý do xoá mềm?");
    if (reason === null) return;
    try {
      await api.delete(`/imports/${it._id}`, { data: { reason } });
      toast.success("Đã xoá mềm phiếu nhập và trừ tồn kho");
      fetchAll();
    } catch (e) {
      console.error("Soft delete error:", e);
      toast.error(e.response?.data?.message || "Xoá mềm thất bại");
    }
  };

  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p._id, p.name);
    return m;
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Quản lý nhập hàng</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="w-52 rounded-full border-2 border-primary px-9 py-2 text-sm outline-none focus:ring-2 ring-handmade"
              placeholder="Lọc theo mã phiếu, nguồn..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="rounded border px-3 py-2" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
            <option value="">Tất cả sản phẩm</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
            Hiển thị đã xoá
          </label>
          <button className="btn-outline flex items-center gap-2" onClick={() => { setPage(1); fetchAll(); }}>
            <FaRotateRight /> Làm mới
          </button>
          <select className="rounded border px-3 py-2" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}/trang</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="card-stable grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-6 flex items-center justify-between">
          <h3 className="text-base font-semibold">Tạo phiếu nhập</h3>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm">Sản phẩm</label>
          <select className="w-full rounded border px-3 py-2" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
            <option value="">Chọn sản phẩm</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Số lượng</label>
          <input className="w-full rounded border px-3 py-2" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Đơn giá</label>
          <input className="w-full rounded border px-3 py-2" type="number" min={0} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Nguồn</label>
          <input className="w-full rounded border px-3 py-2" placeholder="Nhà cung cấp..." value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-sm">Ghi chú</label>
          <input className="w-full rounded border px-3 py-2" placeholder="Ghi chú..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-2">
          <button type="reset" className="btn-outline" onClick={() => setForm({ product: "", quantity: 0, unitPrice: 0, source: "", note: "" })}>Reset</button>
          <button className="btn-primary flex items-center gap-2"><FaPlus /> Tạo</button>
        </div>
      </form>

      {/* List */}
      <div className="card-stable p-4">
        {loading ? (
          <div className="text-muted">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="text-muted">Chưa có phiếu nhập</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">Mã</th>
                  <th className="px-2 py-2">Sản phẩm</th>
                  <th className="px-2 py-2">Số lượng</th>
                  <th className="px-2 py-2">Đơn giá</th>
                  <th className="px-2 py-2">Nguồn</th>
                  <th className="px-2 py-2">Ghi chú</th>
                  <th className="px-2 py-2">Ngày</th>
                  <th className="px-2 py-2">Trạng thái</th>
                  <th className="px-2 py-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((it) => {
                    const t = q.trim().toLowerCase();
                    if (!t) return true;
                    const txt = `${it._id} ${it.source || ''} ${it.note || ''}`.toLowerCase();
                    return txt.includes(t);
                  })
                  .map((it) => (
                    <tr key={it._id} className="border-t">
                      <td className="px-2 py-2">{it._id.slice(-8)}</td>
                      <td className="px-2 py-2">{it.product?.name || it.product}</td>
                      <td className="px-2 py-2">{it.quantity}</td>
                      <td className="px-2 py-2">{Number(it.unitPrice || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                      <td className="px-2 py-2">{it.source || '-'}</td>
                      <td className="px-2 py-2">{it.note || '-'}</td>
                      <td className="px-2 py-2">{new Date(it.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-2 py-2">{it.deleted ? <span className="text-red-600">Đã xoá</span> : <span className="text-green-700">Hoạt động</span>}</td>
                      <td className="px-2 py-2 text-right">
                        {!it.deleted && (
                          <>
                            <button className="btn-outline !py-1 text-xs mr-2" onClick={() => openEdit(it)}><FaEdit /> Sửa</button>
                            <button className="btn-outline !py-1 text-xs" onClick={() => handleSoftDelete(it)}><FaTrash /> Xoá mềm</button>
                          </>
                        )}
                        {it.deleted && (
                          <span className="text-xs text-muted">{it.deleteReason ? `Lý do: ${it.deleteReason}` : ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>Tổng: {total}</div>
            <div className="flex items-center gap-2">
              <button className="btn-outline !py-1" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
              <span>Trang {page}/{totalPages}</span>
              <button className="btn-outline !py-1" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Cập nhật phiếu nhập #{editing._id.slice(-8)}</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">Số lượng</label>
                  <input className="w-full rounded border px-3 py-2" type="number" min={0} value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Đơn giá</label>
                  <input className="w-full rounded border px-3 py-2" type="number" min={0} value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">Nguồn</label>
                <input className="w-full rounded border px-3 py-2" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Ghi chú</label>
                <input className="w-full rounded border px-3 py-2" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Đóng</button>
                <button className="btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Imports;
