import React from "react";
import { useNavigate } from "react-router-dom";

const BuyNowButton = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    navigate("/order"); // chuyển tới order.jsx
  };

  return (
    <button
      onClick={handleBuyNow}
      className={`btn-outline px-6 py-2 ${className}`}
    >
      Mua hàng
    </button>
  );
};

export default BuyNowButton;
