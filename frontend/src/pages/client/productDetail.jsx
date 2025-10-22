import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../../contexts/cart.context.jsx";
import { AuthContext } from "../../contexts/auth.context.jsx";
import { useToast } from "../../contexts/toast.context.jsx";
import api from "../../utils/customAxios.js";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { FavoriteContext } from "../../contexts/favorite.context.jsx";
import { FaHeart, FaRegHeart } from "react-icons/fa";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { currentUser } = useContext(AuthContext);
  const toast = useToast();
  const { isFavorite, toggle } = useContext(FavoriteContext);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
        const relatedResponse = await api.get(`/products/related/${id}`);
        setRelatedProducts(relatedResponse.data || []);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      // Redirect to login with intent to add this product and qty after login
      navigate(`/login?intent=add-to-cart&productId=${encodeURIComponent(product._id || product.id)}&qty=${qty}&redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const res = await addToCart(product, qty);
    if (res?.ok) {
      toast.success(`Đã thêm ${qty} sản phẩm vào giỏ`, { title: "Giỏ hàng" });
    } else {
      toast.error(res?.message || "Lỗi khi thêm sản phẩm vào giỏ", { title: "Giỏ hàng" });
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    await addToCart(product, qty);
    navigate("/order");
  };

  const onToggleFavorite = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const res = await toggle(product._id || product.id);
    if (res?.ok) {
      toast.success(res.favorite ? "Đã thêm vào yêu thích" : "Đã xoá khỏi yêu thích");
    } else {
      toast.error(res?.message || "Không thể cập nhật yêu thích");
    }

    useEffect(() => {
      if (!currentUser) {
        setCanReview(false);
        setReviewReason('Vui lòng đăng nhập để đánh giá');
        return;
      }
      fetch(`/api/products/${id}/review-eligibility`, { credentials: 'include' })
        .then(r => r.json())
        .then(res => {
          setCanReview(Boolean(res?.canReview));
          setReviewReason(res?.reason || '');
        })
        .catch(() => {
          setCanReview(false);
          setReviewReason('Không thể kiểm tra quyền đánh giá');
        });
    }, [id, currentUser]);
  };

  if (loading) {
    return (
      <div className="bg-parchment min-h-screen w-full">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl bg-gray-200 md:h-[480px]" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-28 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-parchment min-h-screen w-full">
        <div className="text-ink mx-auto max-w-7xl px-5 py-12 text-center">
          Không tìm thấy sản phẩm.
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length ? product.images : [""];
  const activeImg = images[Math.min(activeIdx, images.length - 1)] || "";

  return (
    <div className="bg-page min-h-screen w-full">
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="border-primary flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-white">
              {activeImg ? (
                <img
                  src={activeImg}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-muted">Không có ảnh</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-3 sm:grid-cols-6">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`border-primary flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white ${i === activeIdx ? "ring-handmade ring-2" : ""}`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={`thumb-${i}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-muted text-xs">No Img</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-ink text-2xl font-semibold md:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              {renderStars(product.rate || 0)}
              <span className="text-muted text-sm">
                {Number(product.rate || 0).toFixed(1)} / 5
              </span>
            </div>

            {/* Price */}
            <div className="text-accent mt-4 text-2xl font-bold md:text-3xl">
              {formatCurrency(product.price)}
            </div>

            {/* Stock & Category */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-ink">
                Còn hàng: <b>{product.stock || 0}</b>
              </span>
              {product.category && (
                <span className="chip">
                  {typeof product.category === "object"
                    ? product.category.name
                    : product.category}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-5">
              <div className="text-ink mb-2 text-sm font-medium">Số lượng</div>
              <div className="border-primary inline-flex items-center overflow-hidden rounded-full border bg-white">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="text-accent hover:bg-primary h-9 w-9 text-lg font-bold select-none"
                  aria-label="Giảm"
                >
                  −
                </button>
                <div className="text-ink h-9 w-10 text-center leading-9 select-none">
                  {qty}
                </div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="text-accent hover:bg-primary h-9 w-9 text-lg font-bold select-none"
                  aria-label="Tăng"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary h-11 px-6 text-base"
              >
                Thêm vào giỏ
              </button>
              <button
                onClick={handleBuyNow}
                className="btn-outline h-11 px-6 text-base"
              >
                Mua ngay
              </button>
              <button
                onClick={onToggleFavorite}
                className="btn-outline h-11 px-4 text-base flex items-center gap-2"
                aria-label="Yêu thích"
                title="Thêm/Xoá yêu thích"
              >
                {isFavorite(product._id || product.id) ? (
                  <FaHeart className="text-red-500" />
                ) : (
                  <FaRegHeart />
                )}
                <span>{isFavorite(product._id || product.id) ? "Đã thích" : "Yêu thích"}</span>
              </button>
            </div>

            {/* Short desc */}
            <p className="text-muted mt-4 text-sm leading-relaxed">
              {product.description?.slice(0, 200) || ""}
              {product.description && product.description.length > 200
                ? "…"
                : ""}
            </p>
          </div>
        </div>

        {/* Detail & Feedback */}
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card-handmade p-5 md:col-span-2 md:p-6">
            <h3 className="text-ink mb-3 text-lg font-semibold">
              Mô tả chi tiết
            </h3>
            <div className="prose text-ink/90 max-w-none leading-relaxed whitespace-pre-wrap">
              {product.description || "Chưa có mô tả."}
            </div>
          </div>

          <div className="card-handmade p-5 md:p-6">
            <h3 className="text-ink mb-3 text-lg font-semibold">
              Đánh giá ({product.feedbacks?.length || 0})
            </h3>
            <div className="space-y-4">
              {(product.feedbacks || []).slice(0, 5).map((fb, idx) => (
                <div key={idx} className="border-primary rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-ink text-sm font-medium">
                      {fb.user?.name || "Người dùng"}
                    </div>
                    <div className="text-star">
                      {renderStars(fb.rating || 0)}
                    </div>
                  </div>
                  <p className="text-ink/90 mt-1 text-sm">{fb.comment}</p>
                </div>
              ))}
              {(product.feedbacks || []).length === 0 && (
                <div className="text-muted text-sm">Chưa có đánh giá.</div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section className="mt-12">
          <h3 className="text-ink mb-4 text-lg font-semibold">
            Có thể bạn cũng thích
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {relatedProducts.map((related) => (
              <div
                key={related._id}
                className="card-handmade w-60 flex-shrink-0 cursor-pointer p-3"
                onClick={() => navigate(`/product/${related._id}`)}
              >
                <div className="border-primary relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white">
                  {related.images?.[0] ? (
                    <img
                      src={related.images[0]}
                      alt={related.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-muted">Không có ảnh</span>
                  )}
                  {(related?.orders || 0) > 20 && (
                    <span className="bg-primary border-primary absolute top-2 left-2 rounded-full border px-2 py-0.5 text-xs">
                      Bán chạy
                    </span>
                  )}
                  <button
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                    onClick={(e) => { e.stopPropagation(); toggle(related._id); }}
                    aria-label="Yêu thích"
                    title={isFavorite(related._id) ? 'Xoá khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {isFavorite(related._id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-ink" />
                    )}
                  </button>
                </div>
                <div className="text-ink line-clamp-2 text-center text-sm font-medium">
                  {related.name}
                </div>
                <div className="text-accent mt-1 text-center text-sm font-semibold">
                  {formatCurrency(related.price)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function renderStars(rate) {
  const full = Math.floor(rate);
  const half = rate % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array(full)
        .fill(0)
        .map((_, i) => (
          <FaStar key={"full" + i} className="text-star" />
        ))}
      {half && <FaStarHalfAlt className="text-star" />}
      {Array(empty)
        .fill(0)
        .map((_, i) => (
          <FaRegStar key={"empty" + i} className="text-star" />
        ))}
    </div>
  );
}

function formatCurrency(price) {
  return (
    price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || ""
  );
}
