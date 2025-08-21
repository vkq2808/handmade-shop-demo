import React, { useState, useContext } from 'react';
import { CartContext } from '../contexts/cart.context.jsx';
import Cart from '../pages/client/cart.jsx';
import IconButton from './IconButton.jsx';

export default function CartIcon() {
  const { cart } = useContext(CartContext);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <div className="cart-container relative inline-flex">
      <IconButton
        iconClassName="fas fa-shopping-cart select-none"
        onClick={toggleCart}
        className={`select-none items-center justify-center ${isCartOpen ? 'text-[#002fff]' : ''}`}
        status={cart.length > 0 ? { count: cart.length } : null}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
      />
    </div>
  );
}
