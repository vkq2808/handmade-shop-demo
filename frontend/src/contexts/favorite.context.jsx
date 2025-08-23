import { createContext, useCallback, useEffect, useState } from 'react';
import api from '../utils/customAxios.js';

export const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/favorites');
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lazy load on first mount; consumers can also call refresh
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((productId) => {
    return items.some((p) => (p._id || p.id) === productId);
  }, [items]);

  const toggle = useCallback(async (productId) => {
    try {
      const res = await api.post(`/favorites/${productId}`);
      const { favorite } = res.data || {};
      if (favorite) {
        // Optimistic: fetch details not returned here -> refresh
        await refresh();
      } else {
        setItems((prev) => prev.filter((p) => (p._id || p.id) !== productId));
      }
      return { ok: true, favorite };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || 'Không thể cập nhật yêu thích' };
    }
  }, [refresh]);

  const value = { items, loading, refresh, isFavorite, toggle };
  return (
    <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>
  );
}
