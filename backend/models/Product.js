const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên sản phẩm']
  },
  // URL/search friendly slug derived from name
  slug: {
    type: String
  },
  // ASCII-folded version of name for diacritic-insensitive search
  nameNormalized: {
    type: String,
    index: true,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả']
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá sản phẩm']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Vui lòng chọn danh mục']
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  images: {
    type: [String],
    default: []
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rate: {
    type: Number,
    default: 0
  },
  feedbacks: [feedbackSchema]
}, { timestamps: true });

// Performance indexes to speed up listing and filters
// Helper to remove Vietnamese diacritics and lowercase
function normalizeVi(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function toSlug(str) {
  const base = normalizeVi(str)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return base || '';
}

// Keep nameNormalized in sync
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.nameNormalized = normalizeVi(this.name);
    // generate slug if missing or if name changed
    const gen = toSlug(this.name);
    this.slug = gen || this.slug;
  }
  // Ensure slug fallback if still empty/falsy
  if (!this.slug) {
    this.slug = `p-${String(this._id || '').toString().slice(-8)}`;
  }
  next();
});

// Ensure slug uniqueness by appending a short suffix if collision occurs
productSchema.pre('save', async function (next) {
  if (!this.isModified('slug')) return next();
  if (!this.slug) return next();
  const Model = this.constructor;
  let candidate = this.slug;
  let i = 1;
  while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${this.slug}-${i++}`;
  }
  this.slug = candidate;
  next();
});

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 1 });
// Unique slug only when it exists and not empty
productSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true, $ne: '' } } });

module.exports = mongoose.model('Product', productSchema);
