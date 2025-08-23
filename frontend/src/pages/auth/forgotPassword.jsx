import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customAxios from '../../utils/customAxios';
import HMlogo from '../../assets/HMlogo.png';
import { FaArrowLeft } from 'react-icons/fa';
import MainIcon from '../../components/MainIcon';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await customAxios.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setEmail(''); // Clear email after successful submission
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-page-sky flex min-h-screen w-full flex-col">
      {/* Top: back button */}
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
          <div className="mb-6 flex flex-col items-center">
            <MainIcon />
            <h1 className="text-ink mt-3 text-2xl font-bold">Quên mật khẩu</h1>
            <p className="text-muted mt-1 text-sm text-center">
              Nhập email của bạn để nhận link đặt lại mật khẩu
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Nhập email của bạn"
            />
          </div>

          {error && (
            <div className="mt-2 text-center text-sm text-red-600">{error}</div>
          )}

          {message && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center text-sm text-green-800">{message}</div>
              <div className="text-center text-xs text-green-600 mt-1">
                Vui lòng kiểm tra email (kể cả thư mục spam) và làm theo hướng dẫn.
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
                Đang gửi...
              </div>
            ) : (
              'Gửi link đặt lại mật khẩu'
            )}
          </button>

          <div className="text-ink mt-4 text-center text-sm space-y-2">
            <div>
              <Link to="/login" className="font-medium underline">
                Quay lại đăng nhập
              </Link>
            </div>
            <div>
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-medium underline">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
