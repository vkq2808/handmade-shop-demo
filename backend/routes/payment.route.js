const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { createPaymentForOrder, getPayments, getPaymentsStats } = require('../controllers/payment.controller');

// Admin create payment for an order
router.post('/orders/:id', protect, isAdmin, createPaymentForOrder);

// Admin list payments
router.get('/', protect, isAdmin, getPayments);

// Admin payments stats
router.get('/stats', protect, isAdmin, getPaymentsStats);

module.exports = router;
