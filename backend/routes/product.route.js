const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  deleteProduct,
  updateProduct,
  addFeedback,
  getProductSearch,
  getRelatedProducts,
  getReviewEligibility,
  updateMyFeedback,
  getMyFeedback,
  getReviewedFlags,
} = require("../controllers/product.controller");
const { protect, isAdmin } = require("../middlewares/auth.middleware");

// Public
router.get("/", getAllProducts);
router.get("/search", getAllProducts); // keep same handler; controller handles search param
router.get("/slug/:slug", getProductBySlug);
router.get("/related/:id", getRelatedProducts);
router.get("/:id/review-eligibility", protect, getReviewEligibility);
router.get("/:id/my-feedback", protect, getMyFeedback);
router.get("/:id", getProductById);
router.post("/:id/feedback", protect, addFeedback);
router.put("/:id/feedback", protect, updateMyFeedback);
router.post("/reviewed-flags", protect, getReviewedFlags);

// Admin only
router.post("/", protect, isAdmin, createProduct);
router.delete("/:id", protect, isAdmin, deleteProduct);
router.put("/:id", protect, isAdmin, updateProduct);

module.exports = router;
