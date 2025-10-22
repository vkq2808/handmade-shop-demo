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

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(helmet());

app.use((req, res, next) => {
  // Ngăn bị nhúng trong iframe ngoài domain
  res.setHeader('X-Frame-Options', 'DENY');

  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self' ${process.env.FRONTEND_URL};
    script-src 'self' ${process.env.FRONTEND_URL} https://apis.google.com https://www.googletagmanager.com;
    style-src 'self' ${process.env.FRONTEND_URL} 'unsafe-inline' https://fonts.googleapis.com;
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


// Logger middlewares
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
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
