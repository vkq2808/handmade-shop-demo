import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from './IconButton.jsx';
import { FavoriteContext } from '../contexts/favorite.context.jsx';
import { AuthContext } from '../contexts/auth.context.jsx';

export default function FavoriteIcon() {
  const { items, toggle } = useContext(FavoriteContext);
  const { currentUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleOpen = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  const handleRemove = async (productId) => {
    // If not logged in, send to login
    if (!currentUser) {
      navigate('/login');
      return;
    }
    await toggle(productId);
  };

  return (
    <div className="cart-container relative inline-flex">
      <IconButton
        iconClassName="fas fa-heart select-none"
        onClick={toggleOpen}
        className={`select-none items-center justify-center rounded-full ${isOpen ? 'text-[#002fff] bg-white/80' : ''}`}
        status={items?.length > 0 ? { count: items.length } : null}
      />

      {isOpen && (
        <>
          {/* Backdrop overlay to focus the dropdown and close on outside click */}
          <div className="fixed inset-0 z-10 bg-white/20" onClick={close} />
          <div
            className="cart-dropdown bg-white absolute top-10 right-0 z-20 w-[92vw] max-w-[720px] rounded-xl border border-black p-3 text-[--primary-text-color] shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <h5 className="select-none font-medium">Sản phẩm yêu thích</h5>
              <button className="btn-outline h-8 px-3 text-xs" onClick={() => { close(); navigate('/favorites'); }}>Xem tất cả</button>
            </div>
            {(!items || items.length === 0) ? (
              <div className="flex h-28 w-full items-center justify-center select-none text-sm">
                <p>Chưa có sản phẩm yêu thích</p>
              </div>
            ) : (
              <ul className="max-h-[50vh] space-y-2 overflow-auto pr-1">
                {items.map((p) => (
                  <li key={p._id || p.id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div
                      className="flex cursor-pointer items-center gap-3"
                      onClick={() => { close(); navigate(`/product/${p._id || p.id}`); }}
                    >
                      <img src={p.images?.[0]} alt={p.name} className="h-12 w-12 rounded object-cover" />
                      <div className="min-w-0">
                        <div className="text-ink line-clamp-1 text-sm font-medium">{p.name}</div>
                        <div className="text-accent text-xs font-semibold">{formatCurrency(p.price)}</div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button
                        className="btn-outline h-8 px-3 text-xs"
                        onClick={() => handleRemove(p._id || p.id)}
                      >
                        Xoá
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatCurrency(price) {
  return price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '';
}
