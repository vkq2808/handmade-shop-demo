const Order = require('../models/Order');
const Product = require('../models/Product');

// [POST] /api/orders - Tạo đơn hàng mới (user)
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddr, paymentMethod, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng không có sản phẩm' });
    }

    let totalAmount = 0;
    const populatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const product = await Product.findById(items[i].product);
      if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

      if (product.stock < items[i].quantity) {
        return res.status(400).json({ message: `Sản phẩm "${product.name}" không đủ hàng` });
      }

      // Trừ tồn kho
      product.stock -= items[i].quantity;
      await product.save();

      const unitPrice = Number(product.price) || 0;
      totalAmount += unitPrice * items[i].quantity;

      populatedItems.push({
        product: product,
        quantity: items[i].quantity,
        inTimePrice: unitPrice,
      });
    }

    const newOrder = new Order({
      user: req.user._id,
      items: populatedItems,
      shippingAddr,
      paymentMethod,
      totalAmount: totalAmount,
      note: note || '' // thêm note nếu có, mặc định chuỗi rỗng
    });

    const savedOrder = await newOrder.save();
    // Add initial status history (pending by default)
    try {
      await Order.findByIdAndUpdate(savedOrder._id, {
        $push: { statusHistory: { status: 'pending', changedAt: new Date(), note: 'Tạo đơn hàng' } }
      });
    } catch { }

    // Save address info to user profile on each order
    try {
      const User = require('../models/User');
      const u = await User.findById(req.user._id);
      if (u) {
        u.address = (shippingAddr?.addressLine || '').trim();
        u.city = (shippingAddr?.city || '').trim();
        u.zipCode = (shippingAddr?.postalCode || '').trim();
        if (shippingAddr?.phone) {
          u.phone = String(shippingAddr.phone).trim();
        }
        await u.save();
      }
    } catch (e) {
      console.warn('Không thể lưu địa chỉ người dùng khi đặt hàng:', e?.message);
    }
    // Fire-and-forget order confirmation email
    try {
      const User = require('../models/User');
      const u = await User.findById(req.user._id).select('name email');
      if (u?.email) {
        const { sendOrderConfirmationEmail } = require('../utils/emailService');
        // populate product names for email
        const orderForEmail = await Order.findById(savedOrder._id).populate('items.product', 'name');
        sendOrderConfirmationEmail(u.email, orderForEmail.toObject(), u.name);
      }
    } catch (e) {
      console.warn('Gửi email xác nhận đơn hàng thất bại:', e?.message);
    }

    res.status(201).json({ message: 'Đặt hàng thành công', order: savedOrder });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: err.message });
  }
};


const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate({
      path: 'items.product',
      select: 'name price images'
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng của bạn', error: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const order = await Order.findById(orderId)
      .populate("items.product", "name price images")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Nếu không phải admin và không phải chủ đơn hàng thì cấm truy cập
    if (userRole !== "admin" && order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
    }

    res.status(200).json({
      message: "Chi tiết đơn hàng",
      order,
    });
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


const payOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Chỉ cho người đặt đơn mới được thanh toán
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán đơn này' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    await order.save();

    res.json({ message: 'Thanh toán thành công', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thanh toán đơn hàng', error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn này' });
    }

    // Block cancel once the order is already on the way or done (support both new and legacy names)
    if (['shipped', 'shipping', 'delivered', 'finished', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Không thể hủy đơn ở trạng thái "${order.status}"` });
    }

    // ✅ Trả lại tồn kho
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: 'cancelled', changedAt: new Date(), note: 'Người dùng hủy đơn' });
    await order.save();

    res.json({ message: 'Đã hủy đơn hàng thành công và hoàn lại tồn kho', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi hủy đơn hàng', error: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const filter = {};

    // Lọc theo trạng thái (giữ lại nếu đang có)
    if (status) {
      const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'finished', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }
      filter.status = status;
    }

    // ✅ Lọc theo thời gian tạo đơn
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        // Đảm bảo lấy hết ngày đó (23:59:59)
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lọc đơn hàng', error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'finished', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status, changedAt: new Date(), note: `Admin cập nhật trạng thái` });
    await order.save();

    res.json({ message: 'Cập nhật trạng thái đơn thành công', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn', error: err.message });
  }
};


const getOrderStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = { isPaid: true }; // chỉ tính doanh thu từ đơn đã thanh toán

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const orders = await Order.find(filter);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      totalOrders,
      totalRevenue,
      from: from || 'Tất cả',
      to: to || 'Tất cả'
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thống kê doanh thu', error: err.message });
  }
};

const getDailyRevenue = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thống kê theo ngày', error: err.message });
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Convert format to readable string
    const formatted = stats.map(s => ({
      month: `${s._id.month}/${s._id.year}`,
      totalRevenue: s.totalRevenue,
      count: s.count
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thống kê theo tháng', error: err.message });
  }
};

// [PUT] /api/orders/:id/mark-paid - Admin marks a delivered COD order as paid
const adminMarkPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Only for COD orders
    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ message: 'Chỉ có thể ghi nhận thanh toán cho đơn COD' });
    }

    // Only when delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ ghi nhận thanh toán khi đơn đã giao thành công (delivered)' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Đơn hàng đã được ghi nhận thanh toán trước đó' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: 'delivered', changedAt: new Date(), note: 'Admin ghi nhận thanh toán COD' });
    await order.save();

    res.json({ message: 'Đã ghi nhận thanh toán COD cho đơn hàng', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi ghi nhận thanh toán', error: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  payOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  getDailyRevenue,
  getMonthlyRevenue
};
