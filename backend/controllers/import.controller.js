const Import = require('../models/Import');
const Product = require('../models/Product');

// Create an import record and increase product stock
const createImport = async (req, res) => {
  try {
    const { product, quantity, unitPrice, source, note } = req.body;
    if (!product || quantity == null || unitPrice == null) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' });
    }
    if (Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Số lượng nhập phải lớn hơn 0' });
    }
    const p = await Product.findById(product);
    if (!p) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const imp = new Import({
      product,
      quantity: Number(quantity) || 0,
      unitPrice: Number(unitPrice) || 0,
      source: source || '',
      note: note || '',
      createdBy: req.user?._id,
    });
    const saved = await imp.save();

    // Increase stock (guard non-negative and numeric)
    p.stock = Math.max(0, Number(p.stock || 0) + Number(quantity || 0));
    await p.save();

    res.status(201).json(saved);
  } catch (e) {
    console.error('createImport error:', e);
    res.status(500).json({ message: 'Lỗi server khi tạo phiếu nhập', error: e.message });
  }
};

// List imports with pagination and filters
const listImports = async (req, res) => {
  try {
    const { page = 1, limit = 10, product, includeDeleted } = req.query;
    const query = {};
    if (product) query.product = product;
    if (!includeDeleted) query.deleted = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      Import.countDocuments(query),
      Import.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('product', 'name images price stock')
        .populate('createdBy', 'name email')
    ]);

    res.json({ total, page: Number(page), totalPages: Math.ceil(total / limit), items });
  } catch (e) {
    console.error('listImports error:', e);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phiếu nhập', error: e.message });
  }
};

// Update quantity/unitPrice/source/note
const updateImport = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unitPrice, source, note } = req.body;
    const imp = await Import.findById(id);
    if (!imp) return res.status(404).json({ message: 'Phiếu nhập không tồn tại' });
    if (imp.deleted) return res.status(400).json({ message: 'Phiếu nhập đã bị xoá mềm' });

    // If quantity changed, adjust product stock by delta
    const updates = {};
    if (typeof quantity !== 'undefined') updates.quantity = Number(quantity);
    if (typeof unitPrice !== 'undefined') updates.unitPrice = Number(unitPrice);
    if (typeof source !== 'undefined') updates.source = source;
    if (typeof note !== 'undefined') updates.note = note;

    const oldQty = Number(imp.quantity);
    const newQty = typeof quantity !== 'undefined' ? Number(quantity) : oldQty;
    const delta = newQty - oldQty;

    Object.assign(imp, updates);
    const saved = await imp.save();

    if (delta !== 0) {
      const p = await Product.findById(imp.product);
      if (p) {
        p.stock = Number(p.stock || 0) + delta;
        if (p.stock < 0) p.stock = 0;
        await p.save();
      }
    }

    res.json(saved);
  } catch (e) {
    console.error('updateImport error:', e);
    res.status(500).json({ message: 'Lỗi server khi cập nhật phiếu nhập', error: e.message });
  }
};

// Soft delete with reason and rollback stock
const softDeleteImport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const imp = await Import.findById(id);
    if (!imp) return res.status(404).json({ message: 'Phiếu nhập không tồn tại' });
    if (imp.deleted) return res.status(400).json({ message: 'Phiếu nhập đã bị xoá mềm' });

    imp.deleted = true;
    imp.deleteReason = reason || '';
    imp.deletedAt = new Date();
    await imp.save();

    // Rollback stock
    const p = await Product.findById(imp.product);
    if (p) {
      p.stock = Number(p.stock || 0) - Number(imp.quantity || 0);
      if (p.stock < 0) p.stock = 0;
      await p.save();
    }

    res.json({ message: 'Đã xoá mềm phiếu nhập', import: imp });
  } catch (e) {
    console.error('softDeleteImport error:', e);
    res.status(500).json({ message: 'Lỗi server khi xoá mềm phiếu nhập', error: e.message });
  }
};

module.exports = { createImport, listImports, updateImport, softDeleteImport };
