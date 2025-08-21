// filepath: /home/khanhnguyen/Downloads/HM/frontend/src/pages/client/order.jsx
import React, { useEffect, useState, useMemo } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import api from "../../utils/customAxios.js";
import { useToast } from "../../contexts/toast.context.jsx";

export default function OrderPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedFlags, setReviewedFlags] = useState({}); // { [productId]: true }
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/orders/my-orders");
        if (mounted) setOrders(res.data || []);
      } catch {
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch reviewed flags for all products in orders
  useEffect(() => {
    const collectIds = () => {
      const ids = [];
      for (const o of orders || []) {
        for (const it of o.items || []) {
          const pid = it?.product?._id || it?.product;
          if (pid) ids.push(String(pid));
        }
      }
      return Array.from(new Set(ids));
    };

    const fetchFlags = async () => {
      const ids = collectIds();
      if (!ids.length) {
        setReviewedFlags({});
        return;
      }
      try {
        setFlagsLoading(true);
        const res = await api.post('/products/reviewed-flags', { productIds: ids });
        const map = res?.data?.reviewed || {};
        setReviewedFlags(map);
      } catch (e) {
        // keep silent; flags remain empty
      } finally {
        setFlagsLoading(false);
      }
    };

    if (orders && orders.length) fetchFlags();
  }, [orders]);

  const normalizeStatus = (status) => {
    const map = { confirmed: "processing", shipping: "shipped" };
    return map[status] || status;
  };

  const prettyStatus = (status) => {
    const s = normalizeStatus(status) || "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getCancelReason = (status) => {
    const s = normalizeStatus(status);
    if (s === "shipped") return "Không thể hủy khi đơn đã vận chuyển";
    if (s === "delivered") return "Không thể hủy khi đơn đã giao";
    if (s === "cancelled") return "Đơn đã bị hủy";
    if (s === "finished") return "Đơn đã hoàn tất";
    return null; // cancellable for others (pending/processing)
  };

  const cancelOrder = async (id) => {
    if (!confirm("Bạn có chắc muốn hủy đơn này?")) return;
    try {
      setRefreshing(true);
      const res = await api.put(`/orders/${id}/cancel`);
      const updated = res.data?.order;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: updated.status } : o)));
      } else {
        // fallback: hard set to cancelled
        setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o)));
      }
      toast.success("Đã hủy đơn hàng");
    } catch (e) {
      console.error("Cancel order error:", e);
      toast.error(e?.response?.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setRefreshing(false);
    }
  };

  const openReviewModal = async (order, product) => {
    setReviewOrderId(order._id);
    const pid = product?._id || product || "";
    const pname = product?.name || "Sản phẩm";
    setReviewProductId(pid);
    setReviewProductName(pname);
    setReviewRating(5);
    setReviewComment("");
    // Prefill if already reviewed
    try {
      const res = await api.get(`/products/${pid}/my-feedback`);
      if (res?.data?.exists && res.data.feedback) {
        setReviewRating(Number(res.data.feedback.rating) || 5);
        setReviewComment(res.data.feedback.comment || "");
      }
    } catch { }
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewOrderId(null);
    setReviewProductId("");
    setReviewProductName("");
    setReviewRating(5);
    setReviewComment("");
  };

  const submitReview = async (e) => {
    e?.preventDefault?.();
    if (!reviewProductId) {
      toast.error("Vui lòng chọn sản phẩm để đánh giá");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Vui lòng nhập nhận xét");
      return;
    }
    try {
      setSubmittingReview(true);
      // Choose method based on reviewed flag
      const already = reviewedFlags[String(reviewProductId)];
      const payload = { comment: reviewComment.trim(), rating: Number(reviewRating) };
      const res = already
        ? await api.put(`/products/${reviewProductId}/feedback`, payload)
        : await api.post(`/products/${reviewProductId}/feedback`, payload);
      if (res.status >= 200 && res.status < 300) {
        toast.success(already ? "Đã cập nhật đánh giá" : "Gửi đánh giá thành công");
        // Optimistically mark/keep as reviewed
        setReviewedFlags((prev) => ({ ...prev, [String(reviewProductId)]: true }));
        closeReviewModal();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Gửi đánh giá thất bại";
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-parchment min-h-screen w-full">
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <h1 className="text-ink mb-4 text-2xl font-semibold">
          Đơn hàng của tôi
        </h1>
        {loading ? (
          <div className="text-muted">Đang tải…</div>
        ) : orders.length === 0 ? (
          <div className="text-muted">Bạn chưa có đơn hàng nào.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="card-stable p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-ink font-medium">
                    Mã đơn: {o._id.slice(-8)}
                  </div>
                  <div className="text-muted text-sm">
                    {new Date(o.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="text-ink/90 mt-2 text-sm">
                  {o.items?.map((it) => {
                    const s = normalizeStatus(o.status);
                    const isFinished = s === "finished" || s === "delivered";
                    const pid = it?.product?._id || it?.product;
                    const isReviewed = pid ? reviewedFlags[String(pid)] : false;
                    return (
                      <div key={it._id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <div className="border-primary flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-white">
                            {it.product?.images?.[0] ? (
                              <img
                                src={it.product.images[0]}
                                alt={it.product?.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted text-xs">No Img</span>
                            )}
                          </div>
                          <div>
                            <div className="text-ink font-medium">
                              {it.product?.name}
                            </div>
                            <div className="text-muted">
                              Số lượng: {it.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-accent font-semibold">
                            {Number(it.inTimePrice || 0).toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </div>
                          {isFinished && !isReviewed && (
                            <button
                              className="btn-primary !py-1 text-xs"
                              onClick={() => openReviewModal(o, it.product)}
                              title="Đánh giá sản phẩm này"
                            >
                              Đánh giá
                            </button>
                          )}
                          {isFinished && isReviewed && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">Đã đánh giá</span>
                              <button
                                className="btn-outline !py-1 text-xs"
                                onClick={() => openReviewModal(o, it.product)}
                                title="Sửa đánh giá"
                              >
                                Sửa đánh giá
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <div>
                      Trạng thái: <b className="text-ink">{prettyStatus(o.status)}</b>
                      {o.isPaid ? " • Đã thanh toán" : ""}
                    </div>
                    {(() => {
                      const s = normalizeStatus(o.status);
                      const isFinished = s === "finished" || s === "delivered";
                      if (isFinished) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">Đơn đã hoàn tất</span>
                          </div>
                        );
                      }
                      const reason = getCancelReason(o.status);
                      const disabled = !!reason || refreshing;
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={disabled}
                            onClick={disabled ? undefined : () => cancelOrder(o._id)}
                            className="btn-outline !py-1 text-red-600 bg-amber-300 disabled:opacity-50 disabled:!cursor-not-allowed"
                            title="Hủy đơn hàng"
                            aria-disabled={disabled}
                          >
                            Hủy đơn
                          </button>
                          {reason && (
                            <span className="text-xs text-muted">{reason}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-accent font-bold ml-auto">
                    Tổng: {" "}
                    {(o.totalAmount || 0).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </div>
                </div>
                {Array.isArray(o.statusHistory) && o.statusHistory.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <div className="text-muted mb-1 text-sm">Lịch sử trạng thái</div>
                    <ul className="text-sm space-y-1">
                      {o.statusHistory.map((h, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span>{prettyStatus(h.status)}</span>
                          <span className="text-muted">{h.changedAt ? new Date(h.changedAt).toLocaleString("vi-VN") : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeReviewModal}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-ink mb-3 text-lg font-semibold">{reviewedFlags[String(reviewProductId)] ? 'Sửa đánh giá' : 'Gửi đánh giá'}</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <label className="text-ink mb-1 block text-sm font-medium">Sản phẩm</label>
                <div disabled className="border-primary opacity-70 cursor-not-allowed w-full rounded-lg border bg-white px-3 py-2 text-sm">
                  {reviewProductName}
                </div>
              </div>

              <div>
                <label className="text-ink mb-1 block text-sm font-medium">Số sao</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setReviewRating(v)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReviewRating(v); } }}
                      aria-label={`${v} sao`}
                      aria-pressed={reviewRating >= v}
                      className="p-1"
                    >
                      {reviewRating >= v ? (
                        <FaStar className="text-star text-xl" />
                      ) : (
                        <FaRegStar className="text-star text-xl" />
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted">{reviewRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="text-ink mb-1 block text-sm font-medium">Nhận xét</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Chia sẻ trải nghiệm của bạn…"
                  className="border-primary w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={closeReviewModal} className="btn-outline px-4">
                  Hủy
                </button>
                <button type="submit" disabled={submittingReview} className="btn-primary px-5">
                  {submittingReview ? "Đang gửi…" : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
