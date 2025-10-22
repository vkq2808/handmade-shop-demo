import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaSearch,
  FaTimesCircle,
  FaSignOutAlt,
  FaListAlt,
  FaCogs,
  FaHeart,
} from "react-icons/fa";
import HMlogo from "../assets/HMlogo.png";
import { AuthContext } from "../contexts/auth.context.jsx";
import { CartContext } from "../contexts/cart.context.jsx";
import api from "../utils/customAxios.js";
import CartIcon from "./CartIcon.jsx";
import FavoriteIcon from "./FavoriteIcon.jsx";
import CategoryDropdown from "./CategoryDropdown.jsx";

const Header = () => {
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const menuRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Fetch categories directly in the Header component
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // Close on outside click (mobile-friendly)
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [userMenuOpen]);

  // Category dropdown interactions are handled inside CategoryDropdown

  // Clear any pending close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setCurrentUser(null);
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const openUserMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setUserMenuOpen(true);
  };
  const delayedCloseUserMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setUserMenuOpen(false), 180);
  };

  return (
    <header className="border-primary bg-parchment bg-page sticky top-0 z-30 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Left: Logo & brand */}
        <div className="flex min-w-[80px] items-center gap-3">
          <img
            src={HMlogo}
            alt="HM Logo"
            className="h-10 w-10 cursor-pointer object-contain"
            onClick={() => navigate("/")}
          />
          <span
            onClick={() => navigate("/")}
            className="text-ink hidden cursor-pointer text-lg font-semibold select-none sm:inline"
          >
            HM Handmade
          </span>
          <CategoryDropdown
            categories={categories}
            onSelect={(cat) => {
              if (!cat) {
                navigate('/products');
              } else {
                const id = cat._id || cat.id;
                navigate(`/products?category=${encodeURIComponent(id)}`);
              }
            }}
          />
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 justify-center px-4">
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-[280px] transform transition-transform duration-200 focus-within:-translate-y-0.5"
          >
            <FaSearch className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="ring-handmade text-ink placeholder:text-muted border-primary h-11 w-full rounded-full border-2 bg-white pr-10 pl-9 text-sm shadow-sm outline-none focus:shadow-md focus:ring-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Xoá tìm kiếm"
                onClick={() => setSearch("")}
                className="text-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 transition"
              >
                <FaTimesCircle className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {/* Right: Cart & User */}
        <div className="flex min-w-[220px] items-center justify-end gap-3">

          <FavoriteIcon />
          <CartIcon />

          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                className="btn-outline h-9 cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Đăng ký
              </button>
              <button
                className="btn-primary h-9 cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </button>
            </div>
          ) : (
            <div
              ref={menuRef}
              className="relative"
              onMouseEnter={openUserMenu}
              onMouseLeave={delayedCloseUserMenu}
            >
              <button
                className="hover:bg-primary/20 flex cursor-pointer items-center gap-2 rounded-[10px] px-4 py-2 duration-200"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <img
                  src={currentUser.avatar || "/default-avatar.svg"}
                  alt={currentUser.name || "User avatar"}
                  className="h-7 w-7 rounded-full object-cover border ring-1 ring-black/5"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/default-avatar.svg";
                  }}
                />
                <span className="text-ink max-w-[140px] truncate text-sm font-medium">
                  {currentUser.name}
                </span>
              </button>

              {userMenuOpen && (
                currentUser.role === "admin" ? (
                  <div
                    className="border-primary absolute right-0 mt-2 w-52 rounded-2xl border bg-white p-2 shadow-md"
                    onMouseEnter={openUserMenu}
                    onMouseLeave={delayedCloseUserMenu}
                  >
                    <div className="text-muted px-2 py-1 text-xs">Quản lý</div>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/admin");
                      }}
                    >
                      <FaCogs className="h-3 w-3" /> Giao diện quản trị viên
                    </button>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="h-3 w-3" /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-primary absolute right-0 mt-2 w-52 rounded-2xl border bg-white p-2 shadow-md"
                    onMouseEnter={openUserMenu}
                    onMouseLeave={delayedCloseUserMenu}
                  >
                    <div className="text-muted px-2 py-1 text-xs">Tài khoản</div>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/order");
                      }}
                    >
                      <FaListAlt className="h-3 w-3 text-emerald-900" /> Đơn hàng của tôi
                    </button>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/favorites");
                      }}
                    >
                      <FaHeart className="h-3 w-3 text-rose-900" /> Yêu thích
                    </button>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <FaUserCircle className="h-3 w-3 text-cyan-900" /> Hồ sơ
                    </button>
                    <button
                      className="hover:bg-parchment text-ink focus-visible:ring-handmade flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none active:scale-[.98]"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="h-3 w-3" /> Đăng xuất
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
