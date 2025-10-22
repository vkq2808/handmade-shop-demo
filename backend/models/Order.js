const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Unit price at the time of ordering (snapshot)
  inTimePrice: {
    type: Number,
  },

});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  addressLine: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddr: shippingAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['COD', 'MoMo', 'PayPal'],
    default: 'COD'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    // Align with controller/frontend: use processing, shipped.
    // Keep legacy values (confirmed, shipping) for backward compatibility.
    enum: ['pending', 'processing', 'delivered', 'finished', 'cancelled', 'shipping', 'shipped'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  // Track status changes with timestamps
  statusHistory: [
    {
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      note: { type: String }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
