// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
import HMlogo from "../../assets/HMlogo.png";
import React, { useState, useContext } from "react";
import { AuthContext } from "../../contexts/auth.context.jsx";
import { CartContext } from "../../contexts/cart.context.jsx";
import { useToast } from "../../contexts/toast.context.jsx";
import api from "../../utils/customAxios.js";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import MainIcon from "../../components/MainIcon.jsx";

const Login = () => {
  const { setCurrentUser } = useContext(AuthContext);
  const { addToCart, fetchCart } = useContext(CartContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      setCurrentUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // After login: check for intent params to perform post-login actions
      const params = new URLSearchParams(window.location.search);
      const intent = params.get("intent");
      const redirect = params.get("redirect") || "/";
      if (intent === "add-to-cart") {
        const productId = params.get("productId");
        const qty = Number(params.get("qty") || 1);
        if (productId) {
          try {
            await addToCart(productId, qty);
            await fetchCart();
            toast.success(`Đã thêm ${qty} sản phẩm vào giỏ`, { title: "Giỏ hàng" });
          } catch {
            // ignore
          }
        }
      }
      navigate(redirect);
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng nhập thất bại";
      setError(msg);

      // Nếu cần xác thực email, hiển thị form gửi lại email
      if (err.response?.data?.needEmailVerification) {
        setShowResendForm(true);
        setResendEmail(form.email);
      }
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      alert('Vui lòng nhập email');
      return;
    }

    setResending(true);
    try {
      const response = await api.post('/auth/resend-verification', {
        email: resendEmail
      });
      alert(response.data.message);
      setShowResendForm(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-page-sky flex min-h-screen w-full flex-col">
      {/* Top: back button only */}
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
            <h1 className="text-ink mt-3 text-2xl font-bold">Đăng nhập</h1>
            <p className="text-muted mt-1 text-sm">
              Chào mừng trở lại với HM Handmade
            </p>
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
              value={form.email}
              onChange={handleChange}
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
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="mt-2 text-center text-sm text-red-600">{error}</div>
          )}

          {showResendForm && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Vui lòng xác thực email để đăng nhập
              </p>
              <form onSubmit={handleResendVerification}>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Nhập email để gửi lại xác thực"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                  required
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full bg-yellow-600 text-white py-1 px-2 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                </button>
              </form>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary mt-4 w-full justify-center py-2 text-base"
          >
            Đăng nhập
          </button>

          <div className="text-ink mt-3 text-center text-sm">
            <Link to="/forgot-password" className="font-medium underline">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="text-ink mt-2 text-center text-sm">
            Bạn chưa có tài khoản?{" "}
            <Link to="/register" className="font-medium underline">
              Đăng ký
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Login;
