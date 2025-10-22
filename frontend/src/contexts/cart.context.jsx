import React, { createContext, useCallback, useMemo, useState } from "react";
import api from "../utils/customAxios.js";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Lấy giỏ hàng từ backend
  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get("/cart");
      // backend trả { cart: items[], totalItems, totalPrice }
      setCart(res.data?.cart || []);
    } catch {
      console.error("Lỗi khi lấy giỏ hàng");
      setCart([]);
    }
  }, []);

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = useCallback(async (productOrId, quantity = 1) => {
    try {
      const productId =
        typeof productOrId === "string"
          ? productOrId
          : productOrId?._id || productOrId?.id;
      const res = await api.post("/cart", { productId, quantity });
      // addToCart trả { message, cart } trong đó cart là document có items
      setCart(res.data?.cart?.items || []);
      return {
        ok: true,
        status: res.status,
        message: res.data?.message || "Đã thêm vào giỏ hàng",
        cart: res.data?.cart,
      };
    } catch (err) {
      const status = err?.response?.status ?? 0;
      const message = err?.response?.data?.message || "Lỗi khi thêm vào giỏ hàng";
      console.error("Lỗi khi thêm vào giỏ hàng", message);
      return { ok: false, status, message };
    }
  }, []);

  // Cập nhật số lượng sản phẩm trong giỏ (theo cart item id)
  const updateQty = useCallback(async (cartItemId, quantity) => {
    try {
      const res = await api.put(`/cart/update/${cartItemId}`, { quantity });
      setCart(res.data?.cart?.items || []);
    } catch {
      console.error("Lỗi khi cập nhật số lượng");
    }
  }, []);

  // Xoá 1 sản phẩm khỏi giỏ (chấp nhận cart item id hoặc product id)
  const removeFromCart = useCallback(async (idOrProductId) => {
    try {
      // Nếu truyền vào là cart item id, tìm ra product id từ state hiện tại
      let productId = idOrProductId;
      const found = cart.find((i) => i._id === idOrProductId);
      if (found?.product?._id) productId = found.product._id;

      const res = await api.delete(`/cart/remove/${productId}`);
      setCart(res.data?.cart?.items || []);
    } catch {
      console.error("Lỗi khi xoá sản phẩm khỏi giỏ");
    }
  }, [cart]);

  // Xoá toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    try {
      await api.delete("/cart/clear");
      setCart([]);
    } catch {
      console.error("Lỗi khi xoá toàn bộ giỏ hàng");
    }
  }, []);

  // Thanh toán 1 sản phẩm theo productId
  const checkoutProduct = useCallback(async (productId, payload = {}) => {
    try {
      const res = await api.post(`/cart/checkout/${productId}`, payload);
      // Sau khi mua, backend sẽ xoá item khỏi giỏ
      await fetchCart();
      return res.data;
    } catch (err) {
      console.error("Lỗi khi thanh toán sản phẩm");
      throw err;
    }
  }, [fetchCart]);

  const value = useMemo(() => ({
    cart,
    fetchCart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    checkoutProduct,
  }), [cart, fetchCart, addToCart, updateQty, removeFromCart, clearCart, checkoutProduct]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
