import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/customAxios.js";
import { FavoriteContext } from "../../contexts/favorite.context.jsx";
import { FaHeart, FaRegHeart } from "react-icons/fa";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filters from query params (optional)
  const query = useMemo(() => ({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "newest",
  }), [searchParams]);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const { isFavorite, toggle } = useContext(FavoriteContext);

  const loadPage = useCallback(async (nextPage) => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");

    // Abort previous request if still in-flight
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const params = {
        page: nextPage,
        limit: 12,
      };
      if (query.search) params.search = query.search;
      if (query.category) params.category = query.category;
      if (query.sort) params.sort = query.sort;

      const res = await api.get("/products", { params, signal: ctrl.signal });
      console.log(res)
      const data = res.data || {};
      const newItems = Array.isArray(data.products) ? data.products : [];

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p._id || p.id));
        const merged = [...prev];
        for (const it of newItems) {
          const id = it._id || it.id;
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(it);
          }
        }
        return merged;
      });

      setPage(data.page || nextPage);
      const totalPages = data.totalPages || (newItems.length < params.limit ? nextPage : nextPage + 1);
      setHasMore((data.page || nextPage) < totalPages);
    } catch (err) {
      if (err.name === "CanceledError") return; // axios cancel
      if (err.code === "ERR_CANCELED") return; // axios v1
      setError(err?.response?.data?.message || "Không tải được sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, query]);

  // Reset when filters change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [query]);

  // Load first page or when query resets
  useEffect(() => {
    if (items.length === 0 && hasMore && !loading) {
      loadPage(1);
    }
  }, [items.length, hasMore, loading, loadPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // Avoid auto-advancing to page 2 before first page finishes
    if (items.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !loading && hasMore) {
            loadPage(page + 1);
          }
        }
      },
      { rootMargin: "400px 0px 800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, page, loadPage, loading, hasMore]);

  return (
    <div className="bg-page min-h-screen w-full">
      <main className="mx-auto max-w-7xl px-5 py-6 md:py-10">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h1 className="text-ink text-2xl font-semibold">Tất cả sản phẩm</h1>
          {query.search && (
            <div className="text-muted text-sm">Kết quả cho: <b className="text-ink">{query.search}</b></div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <article
              key={p._id || p.id}
              className="card-handmade group cursor-pointer p-3"
            >
              <div className="border-primary relative mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                    onClick={() => navigate(`/product/${p._id || p.id}`)}
                  />
                ) : (
                  <span className="text-muted text-sm">Không có ảnh</span>
                )}
                {p.isFeatured && (
                  <span className="bg-primary border-primary absolute top-2 left-2 rounded-full border px-2 py-0.5 text-xs">Nổi bật</span>
                )}
                <button
                  className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                  onClick={(e) => { e.stopPropagation(); toggle(p._id || p.id); }}
                  aria-label="Yêu thích"
                  title={isFavorite(p._id || p.id) ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
                >
                  {isFavorite(p._id || p.id) ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-ink" />
                  )}
                </button>
              </div>
              <h3 className="text-ink line-clamp-2 text-sm font-medium">{p.name}</h3>
              <div className="text-accent mt-1 text-sm font-semibold">{formatCurrency(p.price)}</div>
            </article>
          ))}
        </div>

        {/* Loading state / skeletons */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-handmade p-3">
                <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-600 mt-6 text-sm">{error}</div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && !error && (
          <div className="text-muted mt-8 text-center text-sm">Không có sản phẩm phù hợp.</div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-10 w-full" />

        {/* Optional fallback button */}
        {!loading && hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              className="btn-outline px-5 py-2"
              onClick={() => loadPage(page + 1)}
            >
              Tải thêm
            </button>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="text-muted mt-6 text-center text-sm">Đã tải hết sản phẩm.</div>
        )}
      </main>
    </div>
  );
}

function formatCurrency(price) {
  return (
    price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || ""
  );
}
