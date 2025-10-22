import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Ví dụ: nếu cần thêm header tuỳ chỉnh
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response, // giữ nguyên để code hiện tại vẫn dùng res.data
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || error.message || "Request error";

    if (status === 401) {
      // Hết phiên / chưa đăng nhập
      localStorage.removeItem("user");
      // Tuỳ chọn: điều hướng về /login
      // if (window.location.pathname !== '/login') window.location.href = '/login';
    }

    // Không làm mất error.response để code hiện tại vẫn đọc err.response?.data
    return Promise.reject(error);
  }
);

export default api;
