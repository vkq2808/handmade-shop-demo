const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { createOrder,
    getMyOrders,
    payOrder,
    cancelOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    getDailyRevenue,
    getMonthlyRevenue } = require('../controllers/order.controller');

// User routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/my-orders/:id', protect, getOrderById);
router.put('/:id/pay', protect, payOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, isAdmin, getAllOrders);
router.put('/:id/status', protect, isAdmin, updateOrderStatus);
router.get('/stats', protect, isAdmin, getOrderStats);
router.get('/stats/daily', protect, isAdmin, getDailyRevenue);
router.get('/stats/monthly', protect, isAdmin, getMonthlyRevenue);
// Fetch single order by id (admin)
router.get('/:id', protect, isAdmin, getOrderById);
// Admin mark COD delivered order as paid
// Note: Payment creation for COD is handled in /api/payments/orders/:id
module.exports = router;
