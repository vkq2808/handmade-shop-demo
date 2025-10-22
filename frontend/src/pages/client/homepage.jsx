import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import banner from "../../assets/banner.png";
import api from "../../utils/customAxios.js";
import { FavoriteContext } from "../../contexts/favorite.context.jsx";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import PromotionSlider from "../../components/PromotionSlider.jsx";
import Policies from "../../components/Policies.jsx";
import { useRef } from "react";

const defaultImgSrc = "https://susach.edu.vn/upload/720x1280/2024/12/cat-cry-meme-002-720x1280.webp"

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const navigate = useNavigate();
  const { isFavorite, toggle } = useContext(FavoriteContext);
  const promotionSliderHeightRef = useRef(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await api.get("/products");
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCats(true);
      try {
        const res = await api.get("/categories");
        const cats = res.data || [];
        setCategories(cats);
        // Set default active category (first one) if not set
        if (!activeCategoryId && cats.length) setActiveCategoryId(cats[0]._id);
      } catch (e) {
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  // Fetch promotions & policies (public)
  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const res = await api.get("/settings/public");
        setPromotions(res?.data?.promotions || []);
        setPolicies(res?.data?.policies || []);
      } catch (e) {
        setPromotions([]);
        setPolicies([]);
      }
    };
    fetchPublic();
  }, []);

  const isLoading = loadingProducts;

  // Derived product views
  const trending = useMemo(() => {
    if (!products?.length) return [];
    // Heuristic: prioritize by orders, then rate, then featured
    return [...products]
      .sort((a, b) => (b.orders || 0) - (a.orders || 0) || (b.rate || 0) - (a.rate || 0) || (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
      .slice(0, 12);
  }, [products]);

  const filteredByCategory = useMemo(() => {
    if (!activeCategoryId) return products;
    return products.filter((p) => {
      const cat = p.category || p.category_id || p.categoryId || p?.category?._id;
      return String(cat) === String(activeCategoryId);
    });
  }, [products, activeCategoryId]);

  const handleExploreClick = () => {
    window.scrollTo({
      top: promotionSliderHeightRef.current.offsetTop - 50,
      behavior: "smooth"
    });
  }

  return (
    <div className="bg-parchment bg-page min-h-screen w-full">

      {/* HERO */}
      <section className="relative h-[78vh] w-full overflow-hidden md:h-[86vh]">
        <img
          src={banner}
          alt="Handmade Banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-0" />
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
          <div className="rounded-2xl bg-white/50 p-6 shadow-sm sm:p-8">
            <h1 className="text-ink text-2xl font-semibold drop-shadow sm:text-3xl md:text-4xl">
              Tinh tế từ đôi tay – Mộc mạc bền lâu
            </h1>
            <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">
              Khám phá các sản phẩm thủ công độc đáo, thân thiện với thiên nhiên
              được tạo nên từ tình yêu và sự tỉ mỉ
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button className="btn-primary" onClick={handleExploreClick}>Khám phá ngay</button>
            </div>
          </div>
        </div>
      </section>

      {/* PROMOTION SLIDER */}
      <div ref={promotionSliderHeightRef}></div>
      <PromotionSlider promotions={promotions} handleNavigate={(link) => navigate(link)} />

      {/* TRENDING PRODUCTS (grid like fe/Home.jsx) */}
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 pt-10">
        <h2 className="text-ink text-2xl font-semibold text-center mb-5">Trending Products</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {(isLoading ? Array.from({ length: 8 }) : trending).map((p, i) => (
            <div
              key={p?._id || i}
              className="card-handmade cursor-pointer p-3 md:p-4 transition-transform duration-500 hover:scale-[1.05]"
              onClick={() => p && navigate(`/product/${p._id}`)}
            >
              <div className="border-primary relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                {isLoading || !p?.images?.[0] ? (
                  <img src={defaultImgSrc} alt={p?.name} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <img src={p.images[0] || defaultImgSrc} alt={p.name} className="h-full w-full object-contain" loading="lazy" />
                )}
                {p && (
                  <button
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); toggle(p._id); }}
                    aria-label="Yêu thích"
                    title={isFavorite(p._id) ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {isFavorite(p._id) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-ink" />}
                  </button>
                )}
              </div>
              <div className="text-ink line-clamp-2 text-center text-sm font-medium md:text-base">{p?.name || "\u00A0"}</div>
              <div className="text-accent mt-1 text-center text-sm font-semibold md:text-base">{p ? formatCurrency(p.price) : "\u00A0"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTS BY CATEGORIES (like fe/Home.jsx) */}
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 mt-10 pb-14">
        <h2 className="text-ink text-2xl font-semibold text-center">Products</h2>

        {/* Category selector */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-3">
          {loadingCats
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="chip animate-pulse">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            ))
            : categories.map((cat) => {
              const isActive = String(activeCategoryId) === String(cat._id);
              return (
                <button
                  key={cat._id}
                  className={
                    `px-4 py-2 rounded-lg text-sm transition-colors ${isActive
                      ? 'bg-[#63c9f5] text-black shadow-sm'
                      : 'hover:bg-[#222] hover:text-white'
                    }`
                  }
                  onClick={() => setActiveCategoryId(cat._id)}
                >
                  {cat.name}
                </button>
              );
            })}
        </div>

        {/* View all */}
        <div className="flex w-full justify-end mt-8 mb-4">
          <button
            className="rounded-xl py-2 px-4 bg-white/70 hover:bg-white text-ink transition"
            onClick={() => navigate(`/products${activeCategoryId ? `?category=${encodeURIComponent(activeCategoryId)}` : ''}`)}
          >
            Xem tất cả
          </button>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-4">
          {(isLoading ? Array.from({ length: 8 }) : filteredByCategory).slice(0, 12).map((p, i) => (
            <div key={p?._id || i} className="card-handmade cursor-pointer p-3 md:p-4 transition-transform duration-500 hover:scale-[1.03]" onClick={() => p && navigate(`/product/${p._id}`)}>
              <div className="border-primary relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                {isLoading || !p?.images?.[0] ? (
                  <img src={defaultImgSrc} alt={p?.name} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <img src={p.images[0] || defaultImgSrc} alt={p.name} className="h-full w-full object-contain" loading="lazy" />
                )}
                {p && (
                  <button
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); toggle(p._id); }}
                    aria-label="Yêu thích"
                    title={isFavorite(p._id) ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {isFavorite(p._id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-ink" />
                    )}
                  </button>
                )}
              </div>
              <div className="text-ink line-clamp-2 text-center text-sm font-medium md:text-base">{p?.name || "\u00A0"}</div>
              <div className="text-accent mt-1 text-center text-sm font-semibold md:text-base">{p ? formatCurrency(p.price) : "\u00A0"}</div>
              <div className="text-star mt-1 flex items-center justify-center text-sm">{!isLoading && p ? renderStars(p.rate || 0) : null}</div>
            </div>
          ))}
        </div>

        {!isLoading && filteredByCategory.length === 0 && (
          <div className="mt-10 flex w-full justify-center">
            <div className="text-center">
              <h3 className="text-ink text-xl font-semibold">Không tìm thấy sản phẩm</h3>
              <p className="text-muted mt-1">Vui lòng thử lại sau</p>
            </div>
          </div>
        )}
      </div>
      {/* POLICIES */}
      <Policies policies={policies} />
      {/* ABOUT - small intro section */}
      <section className="mx-auto w-full max-w-7xl px-5 md:px-8 py-8">
        <div className="rounded-2xl bg-white/70 p-6 md:p-8 shadow-sm text-center">
          <h2 className="text-ink text-2xl font-semibold">Giới thiệu HandMade Shop</h2>
          <p className="text-muted mt-2 max-w-3xl mx-auto text-sm md:text-base">
            HandMade Shop là nơi tôn vinh vẻ đẹp mộc mạc từ những sản phẩm thủ công được làm bằng cả tâm huyết.
            Chúng tôi chọn lọc chất liệu an toàn, thân thiện với môi trường và chăm chút từng chi tiết để
            mang đến cho bạn những món đồ tinh tế, bền bỉ và giàu cảm xúc.
          </p>
          <div className="mt-4 cursor-pointer text-ink btn-outline"
            onClick={() => navigate('/about')}
          >
            Về chúng tôi
          </div>
        </div>
      </section>
    </div>
  );
}

// Render rate (1-5 sao)
function renderStars(rate) {
  const full = Math.floor(rate);
  const half = rate % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex gap-0.5">
      {Array(full)
        .fill("★")
        .map((s, i) => (
          <span key={"full" + i} className="text-star">
            {s}
          </span>
        ))}
      {half && <span className="text-star">☆</span>}
      {Array(empty)
        .fill("☆")
        .map((s, i) => (
          <span key={"empty" + i}>{s}</span>
        ))}
    </div>
  );
}

// Format tiền
function formatCurrency(price) {
  return (
    price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || ""
  );
}
