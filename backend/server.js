const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');

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

app.use(helmet(
  // custom helmet config
))

// Logger middlewares
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

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

let serverPort = process.env.PORT || 5000;

try {
  const privateKey = fs.readFileSync(require('path').join(__dirname, sslKeyPath));
  const certificate = fs.readFileSync(require('path').join(__dirname, sslCertPath));

  const credentials = { key: privateKey, cert: certificate };

  // Create HTTPS server
  https.createServer(credentials, app).listen(serverPort, () => {
    console.log(`🔒 HTTPS Server running on port ${serverPort}`);
  });
} catch (err) {
  console.error('❌ Failed to start HTTPS server. Falling back to HTTP. Error:', err);

  // If certs are missing or unreadable, fallback to HTTP (commented out per request)
  // Uncomment the lines below to enable HTTP fallback
  // app.listen(serverPort, () => console.log(`🚀 Server running on port ${serverPort}`));
}
