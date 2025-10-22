import { useEffect, useState } from "react";
import api from "../utils/customAxios.js";
import { toast } from "react-toastify";

export default function CartItem({
  item,
  fetchCart,
  selectedItems,
  setSelectedItems,
}) {
  const { _id, product, quantity } = item;
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(true);
      await api.put(`/cart/update/${_id}`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch {
      toast.error("Cập nhật số lượng thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, _id]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== _id));
    }
  };

  useEffect(() => {
    // check if item is not fetched
    if (!item || !_id) {
      fetchCart();
    }
  }, [item]);

  return (
    <div className="flex items-center justify-between border-b px-2 py-4">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selectedItems.includes(_id)}
        onChange={handleCheckboxChange}
        className="mr-2"
      />

      {/* Product Info */}
      <div className="flex-1">
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-gray-500">
          {product.price.toLocaleString()} đ
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center overflow-hidden rounded-md border bg-[#C4D8DC]">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={updating}
          className="px-3 py-1 text-xl text-red-600"
        >
          -
        </button>
        <div className="px-4 font-semibold text-red-600">{quantity}</div>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={updating}
          className="px-3 py-1 text-xl text-red-600"
        >
          +
        </button>
      </div>
    </div>
  );
}
