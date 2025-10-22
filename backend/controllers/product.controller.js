const Product = require("../models/Product");
const express = require("express");
const Category = require("../models/Category");
const Order = require("../models/Order");

// [GET] /api/products?keyword=...&category=...

const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      isFeatured,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const queryObj = {};

    // Tìm kiếm theo tên (unicode-insensitive) và slug
    if (search) {
      const normalized = String(search)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
      // Prefer normalized field; fallback to name regex if needed
      queryObj.$or = [
        { slug: { $regex: normalized } },
        { nameNormalized: { $regex: normalized } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // Lọc theo category
    if (category) {
      queryObj.category = category;
    }

    // Lọc theo nổi bật
    if (isFeatured) {
      queryObj.isFeatured = isFeatured === "true";
    }

    // Lọc theo khoảng giá
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // Sắp xếp
    let sortOption = { createdAt: -1 }; // mặc định mới nhất
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    // Parallelize count and find
    const [total, products] = await Promise.all([
      Product.countDocuments(queryObj),
      Product.find(queryObj)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        // Listing endpoint: avoid heavy populate, return category id only
        .select("name slug price images stock isFeatured rate category createdAt")
        .lean(),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    console.error("getAllProducts error:", err); // Add this line
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách sản phẩm", error: err.message });
  }
};

// ...existing code...

const getAllProductsByCategory = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, isFeatured, sort } =
      req.query;

    const queryObj = {};

    if (search) {
      queryObj.name = { $regex: search, $options: "i" };
    }

    if (category) {
      queryObj.category = category; // lọc theo 1 category cụ thể nếu truyền vào
    }

    if (isFeatured) {
      queryObj.isFeatured = isFeatured === "true";
    }

    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    // Lấy tất cả sản phẩm theo filter và populate category để lấy tên
    const products = await Product.find(queryObj)
      .sort(sortOption)
      .populate("category", "name");

    // Nhóm theo category
    const grouped = new Map();
    for (const p of products) {
      // Bỏ qua sản phẩm chưa gán category
      if (!p.category) continue;

      const catId = p.category._id.toString();
      if (!grouped.has(catId)) {
        grouped.set(catId, {
          category: {
            id: catId,
            name: p.category.name,
          },
          products: [],
        });
      }

      grouped.get(catId).products.push({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        images: p.images,
        stock: p.stock,
        isFeatured: p.isFeatured,
        rate: p.rate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }

    res.status(200).json(Array.from(grouped.values()));
  } catch (err) {
    console.error("getAllProductsByCategory error:", err);
    res.status(500).json({
      message: "Lỗi khi lấy sản phẩm theo danh mục",
      error: err.message,
    });
  }
};

// [GET] /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "feedbacks.user",
      "name"
    );
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
};

// [GET] /api/products/slug/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate(
      "feedbacks.user",
      "name"
    );
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy sản phẩm", error: err.message });
  }
};

// [POST] /api/products (admin)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images, isFeatured } =
      req.body;

    if (!category)
      return res.status(400).json({ message: "Vui lòng chọn danh mục" });

    const foundCategory = await Category.findById(category);
    if (!foundCategory)
      return res.status(400).json({ message: "Danh mục không tồn tại" });

    // Stock is managed exclusively via Import records; start at 0 on create
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      stock: 0,
      images,
      isFeatured,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi tạo sản phẩm", error: err.message });
  }
};

// [DELETE] /api/products/:id (admin)
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để xoá" });

    res.json({ message: "Đã xoá sản phẩm" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi xoá sản phẩm", error: err.message });
  }
};

// [PUT] /api/products/:id (admin)
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images, isFeatured } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Do not allow updating stock directly; it is controlled by Import records
    if (typeof stock !== 'undefined') {
      return res.status(400).json({ message: 'Không thể cập nhật tồn kho tại trang sản phẩm. Vui lòng tạo/cập nhật Phiếu nhập (Import) để thay đổi tồn kho.' });
    }

    // Helpers
    const isBlank = (v) => typeof v === 'string' && v.trim() === '';

    // Assign only when provided and not blank (for string fields). Allow numeric 0 and empty array for images.
    if (typeof name !== 'undefined' && !isBlank(name)) product.name = name;
    if (typeof description !== 'undefined' && !isBlank(description)) product.description = description;
    if (typeof price !== 'undefined' && !(typeof price === 'string' && price === '')) product.price = price;
    if (typeof category !== 'undefined' && !isBlank(category)) product.category = category;
    if (typeof images !== 'undefined') product.images = Array.isArray(images) ? images : (isBlank(images) ? product.images : images);
    if (typeof isFeatured !== 'undefined') product.isFeatured = isFeatured;

    // nameNormalized and slug are maintained by pre-save hooks on Product model
    const updated = await product.save();
    res.json(updated);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Lỗi xác thực dữ liệu', error: err.message });
    }
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm", error: err.message });
  }
};

const addFeedback = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Chỉ cho phép đánh giá nếu user đã mua sản phẩm và đơn đã giao thành công
    const purchasedDelivered = await Order.exists({
      user: req.user._id,
      status: { $in: ['delivered', 'finished'] },
      'items.product': product._id,
    });
    if (!purchasedDelivered) {
      return res.status(403).json({ message: 'Bạn chỉ có thể đánh giá sau khi đơn hàng của bạn đã được giao thành công.' });
    }

    // Kiểm tra nếu user đã từng đánh giá
    const alreadyReviewed = product.feedbacks.find(
      (fb) => fb.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này" });
    }

    // Thêm đánh giá mới
    const feedback = {
      user: req.user._id,
      comment,
      rating: Number(rating),
      createdAt: new Date(),
    };

    product.feedbacks.push(feedback);

    // Cập nhật rate trung bình
    const avg =
      product.feedbacks.reduce((acc, fb) => acc + fb.rating, 0) /
      product.feedbacks.length;
    product.rate = Math.round(avg * 10) / 10;

    await product.save();

    res
      .status(201)
      .json({ message: "Đã đánh giá sản phẩm thành công", feedback });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi đánh giá sản phẩm", error: err.message });
  }
};

// [PUT] /api/products/:id/feedback - Cập nhật đánh giá của chính user
const updateMyFeedback = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Tìm feedback của user
    const idx = product.feedbacks.findIndex(
      (fb) => fb.user.toString() === req.user._id.toString()
    );
    if (idx === -1) {
      return res.status(404).json({ message: 'Bạn chưa đánh giá sản phẩm này' });
    }

    if (typeof comment === 'string') product.feedbacks[idx].comment = comment;
    if (typeof rating !== 'undefined') product.feedbacks[idx].rating = Number(rating);

    // Cập nhật rate trung bình
    const avg = product.feedbacks.reduce((acc, fb) => acc + Number(fb.rating || 0), 0) / (product.feedbacks.length || 1);
    product.rate = Math.round(avg * 10) / 10;

    await product.save();
    res.json({ message: 'Cập nhật đánh giá thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật đánh giá', error: err.message });
  }
};

// [GET] /api/products/:id/my-feedback - Lấy đánh giá của chính user cho sản phẩm
const getMyFeedback = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('feedbacks');
    if (!product) return res.status(404).json({ exists: false });
    const fb = product.feedbacks.find((f) => f.user.toString() === req.user._id.toString());
    if (!fb) return res.json({ exists: false });
    return res.json({ exists: true, feedback: { rating: fb.rating, comment: fb.comment, createdAt: fb.createdAt } });
  } catch (err) {
    res.status(500).json({ exists: false, error: err.message });
  }
};

// [GET] /api/products/:id/review-eligibility
const getReviewEligibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('_id feedbacks');
    if (!product) return res.status(404).json({ canReview: false, reason: 'Sản phẩm không tồn tại' });

    // Đã từng đánh giá
    const alreadyReviewed = product.feedbacks.find(
      (fb) => fb.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.json({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này' });
    }

    // Có đơn giao thành công chứa sản phẩm
    const purchasedDelivered = await Order.exists({
      user: req.user._id,
      status: { $in: ['delivered', 'finished'] },
      'items.product': product._id,
    });
    if (!purchasedDelivered) {
      return res.json({ canReview: false, reason: 'Chỉ được đánh giá sau khi đơn hàng đã giao thành công' });
    }

    return res.json({ canReview: true });
  } catch (err) {
    res.status(500).json({ canReview: false, reason: 'Lỗi máy chủ', error: err.message });
  }
};

const getProductSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string')
      return res.status(400).json({ message: 'Thiếu từ khoá tìm kiếm' });

    const normalized = String(query)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

    const products = await Product.find({
      $or: [
        { slug: { $regex: normalized } },
        { nameNormalized: { $regex: normalized } },
        { name: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name slug price images stock isFeatured rate category createdAt')
      .lean();

    res.json(products);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm', error: err.message });
  }
};

// [POST] /api/products/reviewed-flags
// Body: { productIds: string[] }
// Returns: { reviewed: { [productId]: boolean } }
const getReviewedFlags = async (req, res) => {
  try {
    const { productIds } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ reviewed: {} });
    }
    // Find products among the list that have a feedback from the current user
    const docs = await Product.find({
      _id: { $in: productIds },
      'feedbacks.user': req.user._id,
    }).select('_id').lean();

    const reviewedSet = new Set(docs.map(d => String(d._id)));
    const reviewed = {};
    for (const id of productIds) {
      reviewed[String(id)] = reviewedSet.has(String(id));
    }
    res.json({ reviewed });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái đã đánh giá', error: err.message });
  }
};

// [GET] /api/products/related/:id
const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 12 } = req.query;
    const current = await Product.findById(id).select("category");
    if (!current || !current.category) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm hoặc danh mục" });
    }

    const products = await Product.find({
      _id: { $ne: id },
      category: current.category,
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("category", "name");

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm liên quan", error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  deleteProduct,
  updateProduct,
  addFeedback,
  getProductSearch,
  getAllProductsByCategory,
  getRelatedProducts,
  getReviewEligibility,
  updateMyFeedback,
  getMyFeedback,
  getReviewedFlags,
};
