import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HMlogo from "../../assets/HMlogo.png";
import api from "../../utils/customAxios.js";
import { FaArrowLeft } from "react-icons/fa";
import MainIcon from "../../components/MainIcon.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        zipCode: zipCode || undefined,
      };
      const res = await api.post("/auth/register", payload);
      if (res.status === 201 || res.status === 200) {
        setSuccess(res.data.message);
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setAddress("");
        setCity("");
        setZipCode("");
      } else {
        setError(res.data?.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi kết nối máy chủ.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-page-sky flex min-h-screen w-full flex-col">
      {/* Top: back button only (no header) */}
      <div className="mx-auto mt-7 flex h-14 w-full max-w-7xl items-center px-5">
        <button
          onClick={() => navigate(-1)}
          className="group bg-surface/80 text-ink hover:bg-primary/60 focus:ring-handmade inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 focus:ring-2 focus:outline-none active:scale-95"
          aria-label="Quay lại"
        >
          <FaArrowLeft
            size={30}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </button>
      </div>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <form
          onSubmit={handleSubmit}
          className="border-primary bg-primary animate-fadeUp w-full max-w-md rounded-2xl border p-6 shadow-sm"
        >
          <div className="mb-4 flex flex-col items-center">
            <MainIcon />
            <h1 className="text-ink mt-3 text-2xl font-bold">Đăng ký</h1>
            <p className="text-muted mt-1 text-sm">Tạo tài khoản HM Handmade</p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="name"
              className="text-ink mb-1 block text-sm font-medium"
            >
              Họ tên
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="text-ink mb-1 block text-sm font-medium"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="mb-2">
            <label
              htmlFor="password"
              className="text-ink mb-1 block text-sm font-medium"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Optional fields matching the User model */}
          <div className="mt-3">
            <button
              type="button"
              className="btn-outline w-full justify-between px-4 py-2 text-sm"
              onClick={() => setShowOptional((v) => !v)}
              aria-expanded={showOptional}
              aria-controls="optional-fields"
            >
              Thêm thông tin (không bắt buộc)
              <span className="ml-2">{showOptional ? '−' : '+'}</span>
            </button>
            {showOptional && (
              <div id="optional-fields" className="mb-3 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="text-ink mb-1 block text-sm font-medium">Số điện thoại <span className="text-muted">(không bắt buộc)</span></label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                    autoComplete="tel"
                    className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="text-ink mb-1 block text-sm font-medium">Thành phố <span className="text-muted">(không bắt buộc)</span></label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="VD: Hà Nội"
                    autoComplete="address-level2"
                    className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="text-ink mb-1 block text-sm font-medium">Địa chỉ <span className="text-muted">(không bắt buộc)</span></label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã..."
                    autoComplete="address-line1"
                    className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="text-ink mb-1 block text-sm font-medium">Mã bưu chính <span className="text-muted">(không bắt buộc)</span></label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="VD: 100000"
                    autoComplete="postal-code"
                    className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2 text-xs text-muted">Bạn có thể bổ sung hoặc chỉnh sửa các thông tin này sau trong trang Hồ sơ.</div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 text-center text-sm text-red-600">{error}</div>
          )}

          {success && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center text-sm text-green-800 font-medium">{success}</div>
              <div className="text-center text-xs text-green-600 mt-1">
                Vui lòng kiểm tra email và nhấn vào link xác thực để hoàn tất đăng ký.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary mt-4 w-full justify-center py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang đăng ký...
              </div>
            ) : (
              "Đăng ký"
            )}
          </button>

          <div className="text-ink mt-3 text-center text-sm">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-medium underline">
              Đăng nhập
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
