import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/customAxios.js";
import { FavoriteContext } from "../../contexts/favorite.context.jsx";
import { FaHeart, FaRegHeart } from "react-icons/fa";

function useQueryParam(key) {
  const search = useLocation().search;
  return new URLSearchParams(search).get(key) || "";
}

export default function Search() {
  const navigate = useNavigate();
  const { isFavorite, toggle } = useContext(FavoriteContext);
  const q = useQueryParam("search");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!q) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/products`, { params: { search: q } });
        setProducts(res.data?.products || []);
      } catch {
        setError("Có lỗi xảy ra khi tìm kiếm sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [q]);

  return (
    <div className="bg-parchment min-h-screen w-full">

      <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-ink text-xl font-semibold">
            Kết quả cho: <span className="text-accent">{q || "—"}</span>
          </h2>
          {q && (
            <button
              className="btn-outline h-9"
              onClick={() => navigate("/search")}
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-muted">Đang tải…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !q ? (
          <div className="text-muted">Nhập từ khoá để tìm sản phẩm.</div>
        ) : products.length === 0 ? (
          <div className="text-muted">Không tìm thấy sản phẩm nào.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
            {products.map((product) => (
              <a
                key={product._id}
                href={`/product/${product._id}`}
                className="card-handmade block p-3 md:p-4"
              >
                <div className="border-primary relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-muted">Không có ảnh</span>
                  )}
                  <button
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product._id); }}
                    aria-label="Yêu thích"
                    title={isFavorite(product._id) ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {isFavorite(product._id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-ink" />
                    )}
                  </button>
                </div>
                <div className="text-ink line-clamp-2 text-center text-sm font-medium md:text-base">
                  {product.name}
                </div>
                <div className="text-accent mt-1 text-center text-sm font-semibold md:text-base">
                  {product.price?.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
