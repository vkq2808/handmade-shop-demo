const User = require('../models/User');

// [GET] /api/users - list users (admin) — exclude admins
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error: err.message });
  }
};

// [GET] /api/users/:id - get a user (admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -emailVerificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy người dùng', error: err.message });
  }
};

// [PUT] /api/users/:id/role - disabled (admin)
const updateUserRole = async (req, res) => {
  return res.status(400).json({ message: 'Chức năng thay đổi vai trò đã bị vô hiệu hóa' });
};

// [PUT] /api/users/:id/active - toggle or set active (admin)
const updateUserActive = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Không thể khóa/mở khóa chính bạn' });
    }

    // Do not allow locking admins (safety)
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    if (target.role === 'admin') {
      return res.status(400).json({ message: 'Không thể khóa/mở khóa tài khoản quản trị' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    res.json({ message: 'Cập nhật trạng thái thành công', user });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: err.message });
  }
};

// [DELETE] /api/users/:id - delete user (admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản của bạn' });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa người dùng', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserActive,
  deleteUser,
};
