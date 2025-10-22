import React, { useContext, useState } from "react";
import { CartContext } from "../contexts/cart.context.jsx";

export default function BtnAddToCart({ product, qty = 1, className = "" }) {
  const { addToCart } = useContext(CartContext);
  const [showMsg, setShowMsg] = useState(false);

  const handleClick = async () => {
    await addToCart(product, qty);
    setShowMsg(true);
    setTimeout(() => setShowMsg(false), 1200);
  };

  return (
    <>
      <button
        className={`btn-primary px-6 py-2 ${className}`}
        onClick={handleClick}
      >
        Thêm vào giỏ hàng
      </button>
      {showMsg && (
        <div className="border-primary bg-primary text-ink fixed top-20 right-5 z-[100] rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow">
          {`Đã thêm ${qty} sản phẩm vào giỏ`}
        </div>
      )}
    </>
  );
}
