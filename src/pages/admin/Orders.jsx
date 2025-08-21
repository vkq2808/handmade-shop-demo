import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/toast.context.jsx";
import api from "../../utils/customAxios.js";

const Orders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // Sorting & pagination
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await api.get("/orders", { params });
      setOrders(res.data || []);
      setPage(1); // reset page when refetch
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Lỗi tải đơn hàng");
      toast.error(e?.response?.data?.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize legacy statuses to current ones for transition logic
  const normalizeStatus = (status) => {
    if (!status) return "pending";
    const map = { confirmed: "processing", shipping: "shipped" };
    return map[status] || status;
  };

  // Allowed next actions based on current status
  const getAvailableActions = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "pending":
        return ["processing", "cancelled"];
      case "processing":
        return ["shipped", "cancelled"];
      case "shipped":
        return ["delivered"];
      case "delivered":
      case "finished":
      case "cancelled":
      default:
        return [];
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      fetchOrders();
      toast.success("Đã cập nhật trạng thái đơn hàng");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  // Admin creates payment record for delivered COD orders
  const markPaid = async (id) => {
    try {
      await api.post(`/payments/orders/${id}`);
      await fetchOrders();
      toast.success("Đã ghi nhận thanh toán COD");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Ghi nhận thanh toán thất bại");
    }
  };

  // Sorting handler
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Status badge styles
  const statusClass = (status) => {
    const s = normalizeStatus(status);
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
    const map = {
      pending: `${base} bg-yellow-100 text-yellow-800`,
      processing: `${base} bg-blue-100 text-blue-800`,
      shipped: `${base} bg-purple-100 text-purple-800`,
      delivered: `${base} bg-green-100 text-green-800`,
      finished: `${base} bg-emerald-100 text-emerald-800`,
      cancelled: `${base} bg-gray-200 text-gray-700`,
    };
    return map[s] || base;
  };

  // Details modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setDetailOrder(res.data?.order);
    } catch (e) {
      setDetailOrder(null);
      toast.error(e?.response?.data?.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailOrder(null);
  };

  // Derived list: search + sort
  const processed = useMemo(() => {
    let list = [...orders];
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((o) =>
        o._id?.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term)
      );
    }
    list.sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === "totalAmount") {
        va = Number(va || 0);
        vb = Number(vb || 0);
      } else if (sortBy === "createdAt") {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      } else if (sortBy === "status") {
        va = normalizeStatus(a.status);
        vb = normalizeStatus(b.status);
      } else if (sortBy === "customer") {
        va = (a.user?.name || "").toLowerCase();
        vb = (b.user?.name || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [orders, search, sortBy, sortDir]);

  // Pagination slice
  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, pageClamped, pageSize]);

  // Export CSV
  const exportCSV = () => {
    const header = ["OrderID", "Customer", "Total", "Status", "CreatedAt"];
    const rows = processed.map((o) => [
      o._id,
      o.user?.name || "",
      o.totalAmount,
      normalizeStatus(o.status),
      new Date(o.createdAt).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất CSV danh sách đơn hàng");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-end gap-3 bg-surface p-3 rounded-md border border-primary/30">
        <div className="flex flex-col">
          <label className="text-xs text-muted">Trạng thái</label>
          <select
            className="select select-bordered min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
            <option value="finished">finished</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted">Từ ngày</label>
          <input type="date" className="input input-bordered" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted">Đến ngày</label>
          <input type="date" className="input input-bordered" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex flex-col flex-1 min-w-[220px]">
          <label className="text-xs text-muted">Tìm kiếm</label>
          <input
            className="input input-bordered"
            placeholder="Theo mã đơn hoặc khách hàng"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn-outline" onClick={fetchOrders}>Áp dụng</button>
          <button
            className="btn-outline"
            onClick={() => {
              setStatusFilter("");
              setFromDate("");
              setToDate("");
              setSearch("");
              fetchOrders();
            }}
          >
            Xóa lọc
          </button>
          <button className="btn-outline" onClick={exportCSV}>Xuất CSV</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="card-stable overflow-hidden p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-parchment/60">
                <tr className="text-left">
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort("createdAt")}>Ngày tạo {sortBy === "createdAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th className="p-2">Mã</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort("customer")}>Khách {sortBy === "customer" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort("totalAmount")}>Tổng tiền {sortBy === "totalAmount" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th className="p-2">Thanh toán</th>
                  <th className="p-2">Đã TT?</th>
                  <th className="p-2 cursor-pointer" onClick={() => toggleSort("status")}>Trạng thái {sortBy === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th className="p-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const actions = getAvailableActions(o.status);
                  return (
                    <tr key={o._id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</td>
                      <td className="p-2">{o._id}</td>
                      <td className="p-2">{o.user?.name || "Ẩn danh"}</td>
                      <td className="p-2 whitespace-nowrap">{o.totalAmount?.toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap">{o.paymentMethod || '—'}</td>
                      <td className="p-2 whitespace-nowrap">
                        {o.isPaid ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Đã TT</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">Chưa TT</span>
                        )}
                      </td>
                      <td className="p-2"><span className={statusClass(o.status)}>{normalizeStatus(o.status)}</span></td>
                      <td className="p-2 space-x-2 whitespace-nowrap">
                        <button className="btn-outline mr-2 mb-2" onClick={() => openDetail(o._id)}>Chi tiết</button>
                        {actions.length === 0 ? (
                          <>
                            {/* Extra admin action: mark paid for delivered COD orders */}
                            {!o.isPaid && normalizeStatus(o.status) === 'delivered' && (o.paymentMethod === 'COD') ? (
                              <button className="btn-outline mr-2 mb-2" onClick={() => markPaid(o._id)}>
                                Ghi nhận thanh toán (COD only)
                              </button>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </>
                        ) : (
                          actions.map((s) => (
                            <button
                              key={s}
                              className="btn-outline mr-2 mb-2"
                              onClick={() => updateStatus(o._id, s)}
                            >
                              {s}
                            </button>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Hiển thị</span>
              <select
                className="select select-bordered"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-sm text-muted">trên mỗi trang</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-outline" disabled={pageClamped <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
              <span className="text-sm">Trang {pageClamped} / {totalPages}</span>
              <button className="btn-outline" disabled={pageClamped >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Chi tiết đơn</h2>
              <button className="btn-outline" onClick={closeDetail}>Đóng</button>
            </div>
            {detailLoading ? (
              <div>Đang tải...</div>
            ) : !detailOrder ? (
              <div>Không thể tải chi tiết đơn</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted">Mã đơn</div>
                    <div className="font-mono text-sm">{detailOrder._id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">Khách</div>
                    <div>{detailOrder.user?.name || "Ẩn danh"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">Tổng tiền</div>
                    <div>{detailOrder.totalAmount?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted">Thanh toán</div>
                    <div>
                      {detailOrder.paymentMethod} {detailOrder.isPaid ? "(Đã TT)" : "(Chưa TT)"}
                      {detailOrder.isPaid && detailOrder.paidAt ? (
                        <span className="ml-2 text-xs text-muted">lúc {new Date(detailOrder.paidAt).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted">Địa chỉ giao</div>
                  <div className="text-sm">
                    {detailOrder.shippingAddr?.fullName} - {detailOrder.shippingAddr?.phone}
                    <br />
                    {detailOrder.shippingAddr?.addressLine}, {detailOrder.shippingAddr?.city} {detailOrder.shippingAddr?.postalCode}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">Sản phẩm</div>
                  <div className="border rounded">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="p-2">Tên</th>
                          <th className="p-2">SL</th>
                          <th className="p-2">Giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrder.items?.map((it, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{it.product?.name || it.product}</td>
                            <td className="p-2">{it.quantity}</td>
                            <td className="p-2">{Number(it.inTimePrice || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Status history */}
                <div>
                  <div className="text-sm text-muted mb-1">Lịch sử trạng thái</div>
                  {Array.isArray(detailOrder.statusHistory) && detailOrder.statusHistory.length > 0 ? (
                    <ol className="relative border-l pl-4">
                      {[...detailOrder.statusHistory]
                        .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))
                        .map((h, i) => (
                          <li key={i} className="mb-3">
                            <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-primary/70" />
                            <div className="flex items-center gap-2">
                              <span className={statusClass(h.status)}>{normalizeStatus(h.status)}</span>
                              <span className="text-xs text-muted">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}</span>
                            </div>
                            {h.note ? <div className="text-xs text-muted mt-0.5">{h.note}</div> : null}
                          </li>
                        ))}
                    </ol>
                  ) : (
                    <div className="text-sm text-muted">Không có lịch sử trạng thái</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
