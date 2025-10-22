const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkout
} = require('../controllers/cart.controller');

router.post('/', protect, addToCart);
router.get('/', protect, getCart);
//route update
router.put('/update/:productId', protect, updateCartItem);
router.delete('/remove/:productId', protect, removeFromCart);
router.delete('/clear', protect, clearCart);
router.post('/checkout/:productId', protect, checkout);

module.exports = router;