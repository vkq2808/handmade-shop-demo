import React, { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../contexts/toast.context.jsx";
import api, { API_BASE_URL } from "../../utils/customAxios.js";
import { FaPlus, FaSearch, FaStar, FaRegStar, FaTrash, FaEdit, FaUpload } from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";
import ImageInput from "../../components/ImageInput.jsx";

const Products = () => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", isFeatured: false, images: "" });
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null); // current product
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "", images: "", price: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  // Confirm remove image modal state
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmRemoveUrl, setConfirmRemoveUrl] = useState(null);
  const [confirmDontAsk, setConfirmDontAsk] = useState(false);

  // Parse image URLs from create form for a quick preview
  const createImageUrls = useMemo(() => {
    if (!form?.images || typeof form.images !== "string") return [];
    return form.images
      .split(",")
      .map((s) => s.trim())
      .filter((u) => !!u);
  }, [form.images]);

  const toPreviewUrl = (u) => {
    if (!u) return u;
    if (u.startsWith("/uploads/")) {
      const base = API_BASE_URL.replace(/\/api$/, "");
      return base + u;
    }
    return u;
  };

  const getSkipConfirm = () => {
    return document.cookie.split('; ').some((c) => c.startsWith('skipConfirmRemoveImage='));
  };

  const setSkipConfirm = async () => {
    try {
      await api.post('/upload/prefs/skip-remove-confirm');
    } catch (e) {
      console.error('Set skip confirm cookie error:', e);
    }
  };

  // Perform actual removal without UI prompts
  const performRemoveImage = async (url) => {
    try {
      // Server expects path like /uploads/xxx - normalize
      const pathOnly = url?.startsWith('/uploads/') ? url : (() => {
        try {
          const u = new URL(url);
          const idx = u.pathname.indexOf('/uploads/');
          return idx >= 0 ? u.pathname.slice(idx) : null;
        } catch { return null; }
      })();
      await api.delete('/upload', { data: { path: pathOnly || url } });

      // Update edit form list
      setEditForm((prev) => {
        const arr = prev.images.split(',').map((s) => s.trim()).filter(Boolean);
        const next = arr.filter((x) => x !== url && x !== pathOnly);
        return { ...prev, images: next.join(', ') };
      });
      toast.success('Đã xoá ảnh');
    } catch (e) {
      console.error('Remove image error:', e);
      toast.error(e.response?.data?.message || 'Xoá ảnh thất bại');
    }
  };

  // Entry point from UI: decide whether to show confirm modal or remove immediately
  const handleRemoveImage = (url) => {
    if (getSkipConfirm()) {
      performRemoveImage(url);
      return;
    }
    setConfirmRemoveUrl(url);
    setConfirmDontAsk(false);
    setConfirmRemoveOpen(true);
  };

  const extractUrlsFromUpload = (data) => {
    const urls = new Set();
    const push = (x) => {
      if (x) urls.add(x);
    };
    if (!data) return [];

    // Prefer explicit paths array if present
    if (Array.isArray(data.paths) && data.paths.length) {
      data.paths.forEach((x) => push(x));
      return Array.from(urls);
    }

    if (Array.isArray(data.files) && data.files.length) {
      data.files.forEach((f) => push(f?.path || f?.url));
    } else if (Array.isArray(data)) {
      for (const it of data) {
        if (typeof it === "string") push(it);
        else if (it?.path) push(it.path);
        else if (it?.url) push(it.url);
      }
    } else {
      if (data.path) push(data.path);
      if (data.url) push(data.url);
    }
    return Array.from(urls);
  };

  // Internal helper to perform uploads and return collected URLs
  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    try {
      setUploading(true);
      const collected = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("image", f);
        const res = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const urls = extractUrlsFromUpload(res.data);
        if (urls.length) collected.push(...urls);
      }
      return collected;
    } catch (e) {
      console.error("Upload error:", e);
      toast.error(e.response?.data?.message || "Upload thất bại");
      return [];
    } finally {
      setUploading(false);
    }
  };

  // Upload handler for create form
  const handleUploadImagesCreate = async (fileList) => {
    const collected = await uploadFiles(fileList);
    if (!collected.length) return;
    setForm((prev) => {
      const existing = typeof prev.images === "string" && prev.images
        ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const merged = Array.from(new Set([...existing, ...collected]));
      return { ...prev, images: merged.join(", ") };
    });
  };

  // Upload handler for edit modal
  const handleUploadImagesEdit = async (fileList) => {
    const collected = await uploadFiles(fileList);
    if (!collected.length) return;
    setEditForm((prev) => {
      const existing = typeof prev.images === "string" && prev.images
        ? prev.images.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const merged = Array.from(new Set([...existing, ...collected]));
      return { ...prev, images: merged.join(", ") };
    });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [proRes, catRes] = await Promise.all([
        api.get("/products", { params: { page, limit: pageSize, search: q || undefined, category: filterCategory || undefined, sort } }),
        api.get("/categories"),
      ]);
      setProducts(proRes.data.products || []);
      setTotalPages(proRes.data?.totalPages || 1);
      setTotal(proRes.data?.total || 0);
      // backend echoes page; keep local in sync if provided
      if (proRes.data?.page) setPage(proRes.data.page);
      setCategories(catRes.data || []);
    } catch (e) {
      console.error("Fetch products/categories error:", e);
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
  }, [filterCategory, sort, page, pageSize]);

  // Inline quick edit removed in favor of full edit modal

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        images: typeof form.images === "string"
          ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        isFeatured: !!form.isFeatured,
      };
      await api.post("/products", payload);
      setForm({ name: "", description: "", price: "", category: "", isFeatured: false, images: "" });
      // Reset to first page to show newest item if sorting by newest
      setPage(1);
      fetchAll();
      toast.success("Tạo sản phẩm thành công");
    } catch (e) {
      console.error("Create product error:", e);
      toast.error(e.response?.data?.message || "Tạo sản phẩm thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xoá sản phẩm này?")) return;
    try {
      await api.delete(`/products/${id}`);
      // Refresh list to keep pagination totals in sync
      fetchAll();
    } catch (e) {
      console.error("Delete product error:", e);
      toast.error(e.response?.data?.message || "Xoá thất bại");
    }
  };

  const handleToggleFeatured = async (p) => {
    try {
      const next = !p.isFeatured;
      await api.put(`/products/${p._id}`, { isFeatured: next });
      setProducts((prev) => prev.map((x) => x._id === p._id ? { ...x, isFeatured: next } : x));
    } catch (e) {
      console.error("Toggle featured error:", e);
      toast.error("Không thể cập nhật nổi bật");
    }
  };

  // Removed deprecated quick-edit and inline stock update handlers

  const openEditModal = (p) => {
    setEditing(p);
    setEditForm({
      name: p.name || "",
      description: p.description || "",
      category: p.category || "",
      images: Array.isArray(p.images) ? p.images.join(", ") : "",
      price: p.price ?? "",
    });
    setEditOpen(true);
  };

  const handleSubmitEdit = async (e) => {
    e?.preventDefault?.();
    if (!editing) return;
    const put = {
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
      price: Number(editForm.price),
      images: editForm.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      await api.put(`/products/${editing._id}`, put);
      // Do not overwrite stock here; backend manages it via Imports
      setProducts((prev) => prev.map((x) => (x._id === editing._id ? { ...x, ...put, stock: x.stock } : x)));
      setEditOpen(false);
      setEditing(null);
    } catch (e) {
      console.error("Update product error:", e);
      toast.error(e.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const categoryMap = useMemo(() => {
    const m = new Map();
    for (const c of categories) m.set(c._id, c.name);
    return m;
  }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="w-52 rounded-full border-2 border-primary px-9 py-2 text-sm outline-none focus:ring-2 ring-handmade"
              placeholder="Tìm kiếm..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAll()}
            />
          </div>
          <select className="rounded border px-3 py-2" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select className="rounded border px-3 py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng</option>
            <option value="price_desc">Giá giảm</option>
          </select>
          <button
            className="btn-outline flex items-center gap-2"
            onClick={() => {
              setPage(1);
              fetchAll();
            }}
          >
            <FaRotateRight /> Làm mới
          </button>
          <select
            className="rounded border px-3 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[8, 12, 16, 24, 32].map((n) => (
              <option key={n} value={n}>{n}/trang</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="card-stable grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Header */}
        <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-between">
          <h3 className="text-base font-semibold">Thêm sản phẩm</h3>
          {createImageUrls.length > 0 && (
            <span className="text-xs text-muted">{createImageUrls.length} ảnh</span>
          )}
        </div>

        {/* Name */}
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm">Tên</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 lg:col-span-5">
          <label className="mb-1 block text-sm">Mô tả</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            placeholder="Mô tả ngắn về sản phẩm"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Price */}
        <div className="lg:col-span-1">
          <label className="mb-1 block text-sm">Giá</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="0"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>

        {/* Category */}
        <div className="lg:col-span-1">
          <label className="mb-1 block text-sm">Danh mục</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock note */}
        <div className="lg:col-span-1">
          <label className="mb-1 block text-sm">Tồn kho</label>
          <div className="w-full rounded border px-3 py-2 bg-gray-50 text-sm text-gray-600">
            Mặc định: 0
          </div>
        </div>



        {/* Images input (reusable) */}
        <div className="sm:col-span-2 lg:col-span-5">
          <ImageInput
            label="Ảnh"
            multiple={true}
            value={form.images}
            onChange={(v) => setForm({ ...form, images: v })}
          />
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-end gap-2 pt-1">

          <button type="button" className="btn-outline" onClick={() => setForm({ name: "", price: "", category: "", isFeatured: false, images: "" })}>Reset</button>
          {/* Featured toggle */}
          <button
            type="button"
            className={`chip btn-primary text-xl flex items-center justify-center gap-2 ${form.isFeatured ? "chip-active" : ""}`}
            onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
            aria-pressed={form.isFeatured}
          >
            <FaStar className={form.isFeatured ? "text-yellow-500" : "opacity-60"} />
            {form.isFeatured ? "Nổi bật" : "Đánh dấu nổi bật"}
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2"><FaPlus /> Thêm sản phẩm</button>
        </div>
      </form>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-stable h-52 animate-pulse bg-parchment" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const img = Array.isArray(p.images) && p.images.length ? p.images[0] : "/vite.svg";
            return (
              <div key={p._id} className="card-stable overflow-hidden">
                <div className="relative h-40 w-full bg-white">
                  <img src={img} alt={p.name} className="h-full w-full object-contain p-3" />
                  <button
                    className="absolute right-2 top-2 rounded-full bg-white/80 p-2 shadow"
                    title={p.isFeatured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                    onClick={() => handleToggleFeatured(p)}
                  >
                    {p.isFeatured ? <FaStar className="text-yellow-500" /> : <FaRegStar />}
                  </button>
                </div>
                <div className="border-t px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="line-clamp-2 font-semibold">{p.name}</div>
                      <div className="text-muted text-sm">{categoryMap.get(p.category) || "-"}</div>
                      {p.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-gray-600">{p.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{p.price?.toLocaleString()}đ</div>
                      <span className={`chip ${p.stock > 0 ? "chip-active" : ""}`}>{p.stock > 0 ? `Còn ${p.stock}` : "Hết hàng"}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-outline flex items-center gap-2" onClick={() => openEditModal(p)}>
                        <FaEdit /> Sửa
                      </button>
                      <button className="btn-outline flex items-center gap-2" onClick={() => handleDelete(p._id)}>
                        <FaTrash /> Xoá
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted">Tổng: {total}</div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
          <span className="text-sm">Trang {page}/{totalPages}</span>
          <button className="btn-outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chỉnh sửa sản phẩm</h3>
              <button className="btn-outline" onClick={() => setEditOpen(false)}>Đóng</button>
            </div>
            <form onSubmit={handleSubmitEdit} className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-sm">Tên</label>
                <input className="w-full rounded border px-3 py-2" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">Mô tả</label>
                <textarea className="w-full rounded border px-3 py-2" rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Giá</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} required min={0} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Danh mục</label>
                <select className="w-full rounded border px-3 py-2" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} required>
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Tồn kho</label>
                <div className="w-full rounded border px-3 py-2 bg-gray-50 text-sm text-gray-600">
                  {editing?.stock ?? 0} (chỉ thay đổi qua mục Nhập hàng)
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">Ảnh (URL, phân tách bằng dấu phẩy)</label>
                <textarea className="w-full rounded border px-3 py-2" rows={3} value={editForm.images} onChange={(e) => setEditForm((f) => ({ ...f, images: e.target.value }))} />
                {/* Upload button */}
                <div className="mt-2 flex items-center gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    className={`flex justify-center chip ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !uploading && editFileInputRef.current?.click()}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) editFileInputRef.current?.click(); }}
                    aria-disabled={uploading}
                    title="Thêm ảnh từ máy tính"
                  >
                    <FaUpload className="text-black" />
                    <span className="ml-1">Chọn ảnh</span>
                  </div>
                  {uploading && <span className="text-xs text-muted">Đang tải lên…</span>}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => { handleUploadImagesEdit(e.target.files); e.target.value = ''; }}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                {/* Previews with remove */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {editForm.images.split(',').map((s) => s.trim()).filter(Boolean).map((u, i) => (
                    <div key={i} className="relative">
                      <img src={toPreviewUrl(u)} alt="preview" className="h-16 w-16 rounded border object-cover" />
                      <button type="button" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rose-600 text-white text-xs" onClick={() => handleRemoveImage(u)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" className="btn-outline" onClick={() => setEditOpen(false)}>Huỷ</button>
                <button type="submit" className="btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm remove image modal */}
      {confirmRemoveOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h4 className="text-base font-semibold">Xoá ảnh này?</h4>
            <p className="mt-1 text-sm text-gray-600">Hành động không thể hoàn tác. Ảnh sẽ bị xoá khỏi máy chủ và bị gỡ khỏi sản phẩm.</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={confirmDontAsk} onChange={(e) => setConfirmDontAsk(e.target.checked)} />
              Không hỏi lại trong 1 ngày
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn-outline" onClick={() => { setConfirmRemoveOpen(false); setConfirmRemoveUrl(null); setConfirmDontAsk(false); }}>Huỷ</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  try {
                    if (confirmDontAsk) await setSkipConfirm();
                    if (confirmRemoveUrl) await performRemoveImage(confirmRemoveUrl);
                  } finally {
                    setConfirmRemoveOpen(false);
                    setConfirmRemoveUrl(null);
                    setConfirmDontAsk(false);
                  }
                }}
              >
                Xoá ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
