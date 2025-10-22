const User = require('../models/User');
const Product = require('../models/Product');

// [GET] /api/favorites - list favorites for current user
const listFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('favorites')
      .populate({ path: 'favorites', select: 'name price images slug rate isFeatured category createdAt' });
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích', error: err.message });
  }
};

// [POST] /api/favorites/:productId - toggle favorite
const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const user = await User.findById(req.user._id).select('favorites');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const pid = product._id.toString();
    const exists = (user.favorites || []).some((p) => p.toString() === pid);

    if (exists) {
      user.favorites = user.favorites.filter((p) => p.toString() !== pid);
      await user.save();
      return res.json({ favorite: false });
    } else {
      user.favorites.push(product._id);
      await user.save();
      return res.json({ favorite: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật yêu thích', error: err.message });
  }
};

// [POST] /api/favorites/add - add by body { productId }
const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Thiếu productId' });
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: product._id } },
      { new: true }
    ).select('favorites');

    res.json({ favorite: true, total: updated.favorites.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thêm vào yêu thích', error: err.message });
  }
};

// [DELETE] /api/favorites/:productId - remove
const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: productId } },
      { new: true }
    ).select('favorites');
    res.json({ favorite: false, total: updated?.favorites?.length || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xoá khỏi yêu thích', error: err.message });
  }
};

// [GET] /api/favorites/check/:productId - check state
const checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id).select('favorites');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    const exists = (user.favorites || []).some((p) => p.toString() === String(productId));
    res.json({ favorite: exists });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra yêu thích', error: err.message });
  }
};

module.exports = {
  listFavorites,
  toggleFavorite,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
