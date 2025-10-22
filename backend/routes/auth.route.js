const express = require('express');
const router = express.Router();
const { register, login, logout, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword, updateProfile, changePassword, updateAvatar, getUser } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { body, validationResult } = require('express-validator');

// POST /api/auth/register
// router.post('/register', register);

// POST /api/auth/login
// router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

router.post('/register', [
  body('name').notEmpty().withMessage('Vui lòng nhập tên người dùng'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('zipCode').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await register(req, res);
});

router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await login(req, res);
});

router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json(await getUser(req.user.id));
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng', error: err.message });
  }
});

// GET /api/auth/verify-email
// GET /api/auth/verify-email
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await resendVerificationEmail(req, res);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await forgotPassword(req, res);
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token là bắt buộc'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await resetPassword(req, res);
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name').optional().notEmpty().withMessage('Tên không được để trống'),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('zipCode').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await updateProfile(req, res);
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await changePassword(req, res);
});

// PUT /api/auth/avatar
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
