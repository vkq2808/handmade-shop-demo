const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { generateEmailVerificationToken, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const { validationResult } = require('express-validator');

// [POST] /api/auth/register
const register = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, phone, address, city, zipCode } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email là bắt buộc' });
    const emailNorm = String(email || '').trim().toLowerCase();
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Kiểm tra email đã tồn tại
    // Case-insensitive email existence check to prevent duplicates with different casing
    const existingUser = await User.findOne({ email: new RegExp(`^${esc(emailNorm)}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo token xác thực email
    const emailVerificationToken = generateEmailVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    // Tạo user mới
    const newUser = new User({
      name,
      email: emailNorm,
      password: hashedPassword,
      phone,
      address: address || '',
      city: city || '',
      zipCode: zipCode || '',
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
      isActive: true
    });

    await newUser.save();

    // Gửi email xác thực
    const emailSent = await sendVerificationEmail(emailNorm, emailVerificationToken, name);

    if (!emailSent) {
      console.warn('Warning: Could not send verification email to:', emailNorm);
      // Không xoá tài khoản; cho phép user yêu cầu gửi lại email.
      return res.status(201).json({
        message: 'Tạo tài khoản thành công nhưng gửi email xác thực thất bại. Vui lòng yêu cầu gửi lại email xác thực.',
        emailSent: false,
        needEmailVerification: true
      });
    }

    // Lưu thời điểm đã gửi email xác thực
    newUser.lastVerificationEmailSentAt = new Date();
    await newUser.save();

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      emailSent: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: err.message });
  }
};

// [POST] /api/auth/login
const login = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const emailNorm = String(email || '').trim().toLowerCase();
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Tìm user theo email
    const user = await User.findOne({ email: new RegExp(`^${esc(emailNorm)}$`, 'i') });
    if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại' });

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Sai mật khẩu' });

    // Kiểm tra tài khoản bị khóa
    if (!user.isActive) return res.status(403).json({ message: 'Tài khoản đã bị khóa' });

    // Kiểm tra email đã được xác thực
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Vui lòng xác thực email trước khi đăng nhập',
        needEmailVerification: true
      });
    }

    // Tạo JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '3d' }
    );

    // Trả cookie + user info
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false // đặt thành true nếu dùng HTTPS
    });

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: err.message });
  }
};

const getUser = async (userId) => {
  const res = await User.findById(userId)
    .select('-password -emailVerificationToken -passwordResetToken')
    .then(user => {
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        city: user.city || "",
        zipCode: user.zipCode || "",
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar
      };
    })
    .catch(err => {
      throw new Error('Lỗi khi lấy thông tin người dùng: ' + err.message);
    });
  return res;
};

// [POST] /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Đăng xuất thành công' });
};

// [GET] /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token xác thực không hợp lệ' });
    }

    // Tìm user theo token
    const user = await User.findOne({ emailVerificationToken: token });
    console.log(user)
    if (!user) {
      return res.status(400).json({ message: 'Token xác thực không hợp lệ', expired: true });
    }

    // Nếu đã xác thực trước đó, coi như thành công (idempotent)
    if (user.isEmailVerified) {
      return res.json({ message: 'Tài khoản đã được xác thực trước đó.', verified: true, already: true });
    }

    // Kiểm tra hạn token
    console.log("Email verification expires at:", user.emailVerificationExpires);
    if (!user.emailVerificationExpires || user.emailVerificationExpires.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.', expired: true });
    }

    // Cập nhật trạng thái xác thực email
    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xác thực email', error: err.message });
  }
};

// [POST] /api/auth/resend-verification
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = String(email || '').trim().toLowerCase();
    const esc = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&');

    if (!emailNorm) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    const user = await User.findOne({ email: new RegExp(`^${esc(emailNorm)}$`, 'i') });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email đã được xác thực' });
    }

    // Cooldown 60s between resend attempts to avoid abuse
    const now = Date.now();
    const last = user.lastVerificationEmailSentAt ? user.lastVerificationEmailSentAt.getTime() : 0;
    const cooldownMs = 60 * 1000;
    const waitMs = last + cooldownMs - now;
    if (waitMs > 0) {
      return res.status(429).json({ message: `Vui lòng thử lại sau ${Math.ceil(waitMs / 1000)} giây` });
    }

    // Generate new token
    const emailVerificationToken = generateEmailVerificationToken();
    const emailVerificationExpires = new Date(now + 24 * 60 * 60 * 1000); // 24 giờ

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send email
    const emailSent = await sendVerificationEmail(emailNorm, emailVerificationToken, user.name);

    if (!emailSent) {
      return res.status(500).json({ message: 'Không thể gửi email xác thực' });
    }

    user.lastVerificationEmailSentAt = new Date(now);
    await user.save();

    res.json({
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.',
      emailSent: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi gửi lại email xác thực', error: err.message });
  }
};

// [POST] /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email)
    const emailNorm = String(email || '').trim().toLowerCase();

    if (!emailNorm) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    const user = await User.findOne({ email: emailNorm });
    const users = await User.find();
    console.log(users)
    if (!user) {
      console.log("email invalid for forget password");
      // Không tiết lộ thông tin email có tồn tại hay không vì lý do bảo mật
      return res.json({
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu trong vài phút tới.',
        emailSent: true
      });
    }

    // Tạo token reset password
    const resetToken = generateEmailVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Gửi email reset password
    console.log(`Gửi email đặt lại mật khẩu đến ${email}, token: ${resetToken}`);
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name);

    if (!emailSent) {
      // Xóa token nếu không gửi được email
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({ message: 'Không thể gửi email đặt lại mật khẩu' });
    }

    res.json({
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu trong vài phút tới.',
      emailSent: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi yêu cầu đặt lại mật khẩu', error: err.message });
  }
};

// [POST] /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Tìm user theo token và kiểm tra token chưa hết hạn
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        expired: true
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.',
      success: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu', error: err.message });
  }
};

// [PUT] /api/auth/profile
const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { name, phone, address, city, zipCode } = req.body;
    const userId = req.user._id;

    // Cập nhật trực tiếp các trường đơn
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(typeof address === 'string' && { address }),
        ...(typeof city === 'string' && { city }),
        ...(typeof zipCode === 'string' && { zipCode }),
      },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({
      message: 'Cập nhật thông tin thành công',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin', error: err.message });
  }
};

// [PUT] /api/auth/change-password
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu', error: err.message });
  }
};

// [PUT] /api/auth/avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const handleDeleteFileUploaded = async (filePath) => {
      if (fs.existsSync(filePath)) {
        console.log("Deleting file:", filePath);
        await fs.promises.unlink(filePath);
      } else {
        console.warn("File not found for deletion:", filePath);
      }
    };

    // Kiểm tra xem có user hay không
    if (!userId) {
      if (req.file && req.file.path) await handleDeleteFileUploaded(req.file.path);
      return res.status(400).json({ message: 'Vui lòng đăng nhập để cập nhật ảnh đại diện' });
    }

    if (!req.file) {
      if (req.file && req.file.path) await handleDeleteFileUploaded(req.file.path);
      return res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên' });
    }

    // Kiểm tra định dạng file
    if (!req.file.mimetype.startsWith('image/')) {
      handleDeleteFileUploaded(req.file.path);
      return res.status(400).json({ message: 'File tải lên phải là ảnh' });
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      handleDeleteFileUploaded(req.file.path);
      return res.status(400).json({ message: 'Kích thước file không được vượt quá 5MB' });
    }

    // Cập nhật avatar cho user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({
      message: 'Cập nhật ảnh đại diện thành công',
      user: updatedUser,
      avatar: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật ảnh đại diện', error: err.message });
    console.error('Error updating avatar:', err);
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  updateAvatar,
  getUser
};
