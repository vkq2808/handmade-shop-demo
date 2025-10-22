const Category = require('../models/Category');

// Lấy tất cả danh mục
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục', error: err.message });
  }
};

// Tạo mới danh mục (admin)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Danh mục đã tồn tại' });

    const category = new Category({ name, description });
    await category.save();

    res.status(201).json({ message: 'Đã tạo danh mục mới', category });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi tạo danh mục', error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    if (name) category.name = name;
    if (isActive !== undefined) category.isActive = isActive;
    if (req.body.description !== undefined) category.description = req.body.description;  

    const updatedCategory = await category.save();

    res.status(200).json({
      message: 'Cập nhật danh mục thành công',
      category: updatedCategory
    });
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi cập nhật danh mục',
      error: err.message
    });
  }
};

module.exports = { getAllCategories, 
  createCategory, 
  updateCategory  
};
