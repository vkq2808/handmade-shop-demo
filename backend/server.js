const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.route');
const productRoutes = require('./routes/product.route');
const uploadRoutes = require('./routes/upload.route');
const orderRoutes = require('./routes/order.route');
const cartRoutes = require('./routes/cart.route');
const categoryRoutes = require('./routes/category.route');
const userRoutes = require('./routes/user.route');
const paymentRoutes = require('./routes/payment.route');
const favoriteRoutes = require('./routes/favorite.route');
const importRoutes = require('./routes/import.route');
const settingsRoutes = require('./routes/settings.route');
const helmet = require ('helmet');

const expressWinston = require('express-winston'); 
const logger = require('./utils/logger.js')
const jwt = require('jsonwebtoken');
const User = require('./models/User');
dotenv.config();

const app = express();

// Giới hạn JSON body 1MB
app.use(express.json({ limit: "1mb" }));

// Giới hạn form-urlencoded 500KB
app.use(express.urlencoded({ limit: "500kb", extended: true }));


const {getLimiter} = require('./config/redis');
app.use('/*', getLimiter());

const xssSanitize = require('xss-sanitize');
const options = {
  whiteList:{}, // Bỏ qua toàn bộ tags
  stripIgnoreTag:true, // Xoá thẻ đã bỏ qua
  stripIgnoreTagBody, // Xoá nội dung bên trong thẻ
}
app.use(xssSanitize(options))

const expressMongoSanitize = require('express-mongo-sanitize');
app.use(expressMongoSanitize({
  allowDots:true
}));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// Cau hinh header
app.use((req, res, next) => {
  // Ngăn bị nhúng trong iframe ngoài domain
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self' ${process.env.FRONTEND_URL} ;
    script-src 'self' ${process.env.FRONTEND_URL} https://apis.google.com https://www.googletagmanager.com;
    style-src 'self' ${process.env.FRONTEND_URL}  https://fonts.googleapis.com;
    img-src 'self' data: blob: ${process.env.FRONTEND_URL} https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' ${process.env.FRONTEND_URL} https://api.stripe.com wss:;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, ' ') // loại bỏ khoảng trắng thừa
      .trim()
  );
  next();
});

// Định danh người dùng từ JWT trong cookie
app.use(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (err) {
    // Không cần xử lý lỗi, nếu token không hợp lệ thì coi như guest
  }
  next();
});
// Ghi log cho các request HTTP
app.use(expressWinston.logger({
  winstonInstance: logger,
  msg: 'HTTP {{req.method}} {{req.url}}', // Định dạng thông báo
  expressFormat: true, // Sử dụng định dạng mặc định của Express
  colorize: false, // Không cần tô màu khi ghi vào file
  meta: true, // Ghi lại metadata (ip, user-agent,...)
  statusLevels: true, // Phân loại log theo mã trạng thái (ví dụ: 5xx là 'error', 4xx là 'warn')
  dynamicMeta: (req, res) => {
    const meta = {};
    if (req.user) {
      meta.userId = req.user._id;
      meta.userEmail = req.user.email;
      meta.userRole = req.user.role;
    }
    else {
      meta.userId = 'Guest';
    }
    return meta;
  }
}));
// Routes
const authLimiter = getLimiter({
  max:10 // 10 request/phút
})
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
