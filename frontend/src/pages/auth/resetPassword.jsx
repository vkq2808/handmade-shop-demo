import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate, useNavigate } from 'react-router-dom';
import customAxios from '../../utils/customAxios';
import HMlogo from '../../assets/HMlogo.png';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import MainIcon from '../../components/MainIcon';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token đặt lại mật khẩu không hợp lệ');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await customAxios.post('/auth/reset-password', {
        token,
        newPassword
      });

      setMessage(response.data.message);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      if (error.response?.data?.expired) {
        setError('Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
      } else {
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <div className="bg-page-sky flex min-h-screen w-full flex-col">
      {/* Top: back button */}
      <div className="mx-auto mt-7 flex h-14 w-full max-w-7xl items-center px-5">
        <button
          onClick={() => navigate('/login')}
          className="group bg-surface/80 text-ink hover:bg-primary/60 focus:ring-handmade inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 focus:ring-2 focus:outline-none active:scale-95"
          aria-label="Quay về đăng nhập"
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
            <h1 className="text-ink mt-3 text-2xl font-bold">Đặt lại mật khẩu</h1>
            <p className="text-muted mt-1 text-sm text-center">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="newPassword"
              className="text-ink mb-1 block text-sm font-medium"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <FaEyeSlash className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="text-ink mb-1 block text-sm font-medium"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="ring-handmade text-ink placeholder:text-muted focus:border-primary w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:ring-2"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-center text-sm text-red-600">{error}</div>
          )}

          {message && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center text-sm text-green-800 font-medium">{message}</div>
              {success && (
                <div className="text-center text-xs text-green-600 mt-1">
                  Đang chuyển hướng đến trang đăng nhập...
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || success}
            className="btn-primary mt-4 w-full justify-center py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang đặt lại...
              </div>
            ) : success ? (
              'Đặt lại thành công!'
            ) : (
              'Đặt lại mật khẩu'
            )}
          </button>

          {!success && (
            <div className="text-ink mt-4 text-center text-sm">
              <Link to="/forgot-password" className="font-medium underline">
                Gửi lại link đặt lại mật khẩu
              </Link>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
