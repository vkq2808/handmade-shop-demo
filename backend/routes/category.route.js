const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
} = require("../controllers/category.controller");
const { protect, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", getAllCategories); // Xem tất cả danh mục
router.post("/", protect, isAdmin, createCategory); // Admin thêm danh mục
router.put("/:id", protect, isAdmin, updateCategory);
// Admin cập nhật danh mục
module.exports = router;
