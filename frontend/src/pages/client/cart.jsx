import React, { useEffect, useState, useContext } from 'react';
import { CartContext } from '../../contexts/cart.context.jsx';
import { useNavigate } from 'react-router-dom';
import IconButton from '../../components/IconButton.jsx';

export default function Cart({ isOpen, onClose }) {
  const { cart, updateQty, removeFromCart, fetchCart } = useContext(CartContext);
  const [previewEnabled, setPreviewEnabled] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchCart(); // Tải giỏ hàng khi mở dropdown
    }
  }, [isOpen, fetchCart]);

  useEffect(() => {
    setPreviewEnabled(Array(cart.length).fill(false));
  }, [cart]);

  const handleNavigate = (link) => {
    onClose();
    navigate(link);
  };

  const handleIncreaseQuantity = (index) => {
    const cartItem = cart[index];
    if (cartItem) {
      const newQty = cartItem.quantity + 1;
      updateQty(cartItem._id, newQty);
    }
  };

  const handleDecreaseQuantity = (index) => {
    const cartItem = cart[index];
    if (cartItem) {
      const newQty = cartItem.quantity - 1;
      if (newQty === 0) {
        handleDeleteItem(index);
      } else {
        updateQty(cartItem._id, newQty);
      }
    }
  };

  const handleDeleteItem = (index) => {
    const cartItem = cart[index];
    if (cartItem) {
      removeFromCart(cartItem._id);
    }
  };

  const handleCheckOut = () => {
    onClose();
    navigate('/checkout');
  };

  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (!isOpen) return null;
  return (
    <div
      style={{
        border: "1px solid #ccc",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
      }}
      className="cart-dropdown absolute top-10 right-[-342px] md:right-0 bg-white text-black p-[10px] w-[100vw] max-w-[888px] max-h-[600px] overflow-y-auto z-50"
    >
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Giỏ hàng</h2>
        <div className='flex items-center'>
          <div
            className='hover:text-blue-400 cursor-pointer text-sm'
            onClick={() => handleCheckOut()}
          >
            Thanh toán
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="flex items-center justify-center h-32 w-full text-lg">
          <p>Giỏ hàng của bạn trống rỗng</p>
        </div>
      ) : (
        <table className='w-full' style={{ listStyleType: 'none', padding: 0 }}>
          <thead>
            <tr>
              <td className="pl-8 text-center text-sm font-semibold">Ảnh</td>
              <td className="pl-8 text-center text-sm font-semibold">Tên sản phẩm</td>
              <td className="pl-8 text-center text-sm font-semibold">Số lượng</td>
              <td className="pl-8 text-center text-sm font-semibold">Đơn giá</td>
              <td className="pl-8 text-center text-sm font-semibold">Tổng tiền</td>
              <td className="pl-8 text-center text-sm font-semibold"></td>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr
                key={item._id}
                style={{ margin: "5px 0" }}
                className='select-none border-b border-gray-100'
              >
                <td className="pl-8 text-center py-2"
                  onClick={() => handleNavigate(`/product/${item.product?._id}`)}>
                  <div className='relative'>
                    <img
                      className='w-[50px] h-[50px] cursor-pointer object-cover rounded'
                      onMouseEnter={() => {
                        setPreviewEnabled(prev => prev.map((_, i) => i === index ? true : false))
                      }}
                      onMouseLeave={() => {
                        setPreviewEnabled(prev => prev.map((_, i) => i === index ? false : false))
                      }}
                      src={item.product?.images?.[0]}
                      alt="Ảnh"
                    />
                    <img
                      className={`w-[300px] absolute top-[100%] left-0 z-[60] border-2 border-black rounded shadow-lg ${previewEnabled[index] ? 'block' : 'hidden'}`}
                      src={item.product?.images?.[0]}
                      alt='Ảnh preview'
                    />
                  </div>
                </td>
                <td className="pl-8 text-center cursor-pointer py-2"
                  onClick={() => handleNavigate(`/product/${item.product?._id}`)}>
                  <div className='text-sm font-medium text-left max-w-[200px] truncate'>
                    {item.product?.name || 'Sản phẩm'}
                  </div>
                </td>
                <td className="pl-8 text-center select-none py-2">
                  <div className="flex items-center justify-center">
                    <IconButton
                      onClick={() => handleDecreaseQuantity(index)}
                      className='items-center justify-center'
                      iconClassName='fa-solid fa-minus'
                      size={12}
                    />
                    <span className='mx-2 text-sm font-medium min-w-[20px]'>{item.quantity}</span>
                    <IconButton
                      onClick={() => handleIncreaseQuantity(index)}
                      className='items-center justify-center'
                      iconClassName='fa-solid fa-plus'
                      size={12}
                    />
                  </div>
                </td>
                <td className="pl-8 text-center py-2">
                  <span className='text-sm font-medium text-orange-600'>
                    {formatNumberWithCommas(Number(item.product?.price || 0))} đ
                  </span>
                </td>
                <td className="pl-8 text-center py-2">
                  <span className='text-sm font-semibold text-orange-600'>
                    {formatNumberWithCommas(Number(item.product?.price || 0) * item.quantity)} đ
                  </span>
                </td>
                <td className="pl-8 text-center py-2">
                  <button
                    className="text-[12px] bg-red-200 hover:bg-red-300 px-2 py-1 rounded-md transition-colors"
                    onClick={() => handleDeleteItem(index)}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}