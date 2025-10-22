const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Admin: create a payment record for a delivered COD order
const createPaymentForOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { note } = req.body || {};

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Chỉ tạo thanh toán cho đơn COD' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ tạo thanh toán khi đơn ở trạng thái delivered' });
    }

    // Prevent duplicate payment record
    const existed = await Payment.findOne({ order: order._id, status: 'completed' });
    if (existed) {
      return res.status(400).json({ message: 'Đơn hàng đã có bản ghi thanh toán' });
    }

    const payment = await Payment.create({
      order: order._id,
      user: order.user,
      amount: order.totalAmount,
      method: 'COD',
      status: 'completed',
      paidAt: new Date(),
      createdBy: req.user?._id,
      note: note || 'Thanh toán COD sau khi giao hàng',
    });

    // Keep order flags for compatibility; set status to finished
    order.isPaid = true;
    order.paidAt = payment.paidAt;
    order.status = 'finished';
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: 'finished', changedAt: new Date(), note: 'Admin tạo bản ghi thanh toán COD' });
    await order.save();

    res.status(201).json({ message: 'Tạo bản ghi thanh toán thành công', payment });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo thanh toán', error: err.message });
  }
};

// Admin: list payments with basic filters
const getPayments = async (req, res) => {
  try {
    const { from, to, method, status } = req.query;
    const filter = {};
    if (method) filter.method = method;
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .populate('order', '_id totalAmount status')
      .populate('user', 'name email');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách thanh toán', error: err.message });
  }
};

// Admin: revenue based on payments
const getPaymentsStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'completed' };
    if (from) match.createdAt = Object.assign(match.createdAt || {}, { $gte: new Date(from) });
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.createdAt = Object.assign(match.createdAt || {}, { $lte: end });
    }
    const stats = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalRevenue = stats[0]?.totalAmount || 0;
    const totalPayments = stats[0]?.count || 0;
    res.json({ totalRevenue, totalPayments });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thống kê thanh toán', error: err.message });
  }
};

module.exports = {
  createPaymentForOrder,
  getPayments,
  getPaymentsStats,
};
