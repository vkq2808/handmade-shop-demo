import React, { useContext, useEffect, useMemo, useState } from "react";
import { CartContext } from "../../contexts/cart.context.jsx";
import { AuthContext } from "../../contexts/auth.context.jsx";
import { useNavigate } from "react-router-dom";
import api from "../../utils/customAxios.js";
import { VIETNAM_CITIES } from "../../utils/vietnamCities.js";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart, clearCart } = useContext(CartContext);
  const { currentUser, fetchProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    postalCode: "",
    note: "",
    paymentMethod: "COD",
  });

  // Saved lists from profile (if available)
  const addressList = useMemo(() => currentUser?.addressList || [], [currentUser]);
  const cityList = useMemo(() => currentUser?.cityList || [], [currentUser]);
  const zipList = useMemo(() => currentUser?.zipCodeList || [], [currentUser]);

  // Build city options: recent (from user) first, then the full VN list (unique)
  const cityOptions = useMemo(() => {
    const recent = (cityList || []).filter(Boolean);
    const unique = new Set(recent);
    VIETNAM_CITIES.forEach(c => unique.add(c));
    return Array.from(unique);
  }, [cityList]);

  // Prefill from profile
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName:
        prev.fullName ||
        (currentUser?.name || ""),
      phone: prev.phone || (currentUser?.phone || ""),
      addressLine: prev.addressLine || (currentUser?.address || ""),
      city: prev.city || (currentUser?.city || ""),
      postalCode: prev.postalCode || (currentUser?.zipCode || ""),
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!cart || cart.length === 0) {
      fetchCart();
    }
  }, [cart, fetchCart]);

  const totalPrice = useMemo(
    () =>
      (cart || []).reduce(
        (sum, it) => sum + (Number(it?.product?.price || 0) * Number(it?.quantity || 0)),
        0
      ),
    [cart]
  );

  const validate = () => {
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên";
    if (!form.phone.trim()) return "Vui lòng nhập số điện thoại";
    if (!/^[0-9+\-()\s]{8,}$/.test(form.phone.trim())) return "Số điện thoại không hợp lệ";
    if (!form.addressLine.trim()) return "Vui lòng nhập địa chỉ";
    if (!form.city.trim()) return "Vui lòng nhập thành phố";
    if (!form.postalCode.trim()) return "Vui lòng nhập mã bưu chính";
    if (!cart || cart.length === 0) return "Giỏ hàng trống";
    return "";
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setLoading(true);
    try {
      const items = cart.map((i) => ({ product: i.product?._id, quantity: i.quantity }));
      const payload = {
        items,
        shippingAddr: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
        },
        paymentMethod: form.paymentMethod,
        note: form.note || "",
      };

      const res = await api.post("/orders", payload);
      if (res?.status === 201) {
        // Refresh user profile so newly saved address/city/zip are available next time
        try { await fetchProfile?.(); } catch { }
        setSuccessMsg("Đặt hàng thành công. Đang chuyển hướng...");
        // Clear cart locally and on server
        try { await clearCart(); } catch { }
        setTimeout(() => navigate("/order"), 1200);
      } else {
        setError(res?.data?.message || "Đặt hàng thất bại");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Đặt hàng thất bại";
      console.error(err);
      if (err?.response?.status === 401) {
        setError("Vui lòng đăng nhập để đặt hàng");
        setTimeout(() => navigate("/login"), 800);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  return (
    <div className="bg-parchment min-h-screen w-full">
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <h1 className="text-ink mb-6 text-2xl font-semibold">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="card-stablelg:col-span-2 p-4">
            <h2 className="text-ink mb-3 text-lg font-semibold">Thông tin giao hàng</h2>
            {error && (
              <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMsg}
              </div>
            )}
            <form onSubmit={placeOrder} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Họ tên" name="fullName" value={form.fullName} onChange={setForm} />
              <Field label="Số điện thoại" name="phone" value={form.phone} onChange={setForm} />
              {/* Address selection with saved options */}
              <SelectOrInput
                label="Địa chỉ"
                name="addressLine"
                value={form.addressLine}
                onChange={setForm}
                options={addressList}
                placeholder="Nhập địa chỉ hoặc chọn từ danh sách"
                className="md:col-span-2"
              />

              {/* City selection: recent + full Vietnam list */}
              <Select
                label="Thành phố"
                name="city"
                value={form.city}
                onChange={setForm}
                options={cityOptions}
              />

              {/* Zip selection with saved options */}
              <SelectOrInput
                label="Mã bưu chính"
                name="postalCode"
                value={form.postalCode}
                onChange={setForm}
                options={zipList}
                placeholder="Nhập mã bưu chính hoặc chọn từ danh sách"
              />
              <div className="md:col-span-2">
                <label className="text-ink/80 mb-1 block text-sm">Ghi chú (không bắt buộc)</label>
                <textarea
                  className="input-handmade h-24 w-full"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-ink/80 mb-1 block text-sm">Phương thức thanh toán</label>
                <select
                  className="input-handmade w-full md:max-w-sm"
                  value={form.paymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="MoMo" disabled>MoMo (sắp ra mắt)</option>
                  <option value="PayPal" disabled>PayPal (sắp ra mắt)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Đang xử lý…" : "Đặt hàng"}
                </button>
              </div>
            </form>
          </section>

          <aside className="card-stablep-4">
            <h2 className="text-ink mb-3 text-lg font-semibold">Đơn hàng</h2>
            {(!cart || cart.length === 0) ? (
              <div className="text-muted">Giỏ hàng trống.</div>
            ) : (
              <div className="space-y-3">
                {(cart || []).map((it) => (
                  <div key={it._id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="border-primary flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-white">
                        {it.product?.images?.[0] ? (
                          <img src={it.product.images[0]} alt={it.product?.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-muted text-xs">No Img</span>
                        )}
                      </div>
                      <div>
                        <div className="text-ink text-sm font-medium max-w-[180px] truncate">{it.product?.name}</div>
                        <div className="text-muted text-xs">SL: {it.quantity}</div>
                      </div>
                    </div>
                    <div className="text-ink text-sm font-semibold">{formatVND((it.product?.price || 0) * (it.quantity || 0))}</div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-ink font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-accent">{formatVND(totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({ label, name, value, onChange, className = "" }) {
  return (
    <div className={className}>
      <label className="text-ink/80 mb-1 block text-sm">{label}</label>
      <input
        className="input-handmade w-full"
        value={value}
        onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options = [], className = "" }) {
  return (
    <div className={className}>
      <label className="text-ink/80 mb-1 block text-sm">{label}</label>
      <select
        className="input-handmade w-full"
        value={value}
        onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
      >
        <option value="">-- Chọn --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function SelectOrInput({ label, name, value, onChange, options = [], placeholder = "", className = "" }) {
  const [mode, setMode] = useState(options?.length ? "select" : "input");
  useEffect(() => {
    if (options?.length && !value) setMode("select");
  }, [options, value]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <label className="text-ink/80 mb-1 block text-sm">{label}</label>
        <button
          type="button"
          className="text-xs underline text-accent"
          onClick={() => setMode((m) => (m === "select" ? "input" : "select"))}
        >
          {mode === "select" ? "Nhập mới" : "Chọn đã lưu"}
        </button>
      </div>
      {mode === "select" && options?.length ? (
        <select
          className="input-handmade w-full"
          value={value}
          onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
        >
          <option value="">-- Chọn --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          className="input-handmade w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
        />
      )}
    </div>
  );
}
