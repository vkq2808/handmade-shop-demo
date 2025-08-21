import React, { useContext } from 'react';
import { FavoriteContext } from '../../contexts/favorite.context.jsx';
import { useNavigate } from 'react-router-dom';

export default function FavoritesPage() {
  const { items, loading, toggle } = useContext(FavoriteContext);
  const navigate = useNavigate();

  return (
    <div className="bg-page min-h-screen w-full">
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <h1 className="text-ink mb-6 text-2xl font-semibold">Sản phẩm yêu thích</h1>
        {loading && <div className="text-muted">Đang tải…</div>}
        {!loading && items.length === 0 && (
          <div className="text-muted">Chưa có sản phẩm yêu thích.</div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <article key={p._id || p.id} className="card-handmade group p-3">
              <div
                className="border-primary relative mb-2 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-white"
                onClick={() => navigate(`/product/${p._id || p.id}`)}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-muted text-sm">Không có ảnh</span>
                )}
              </div>
              <h3 className="text-ink line-clamp-2 text-sm font-medium">{p.name}</h3>
              <div className="text-accent mt-1 text-sm font-semibold">{formatCurrency(p.price)}</div>
              <button
                className="btn-outline mt-2 h-9 text-sm"
                onClick={() => toggle(p._id || p.id)}
              >
                Xoá khỏi yêu thích
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function formatCurrency(price) {
  return price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '';
}
