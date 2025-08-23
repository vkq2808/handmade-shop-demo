const mongoose = require('mongoose');

const ImportSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    source: { type: String, default: '' },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleted: { type: Boolean, default: false },
    deleteReason: { type: String, default: '' },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Import', ImportSchema);
