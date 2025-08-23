const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    link: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
  },
  { _id: false }
);

const PolicySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    promotions: { type: [PromotionSchema], default: [] },
    policies: { type: [PolicySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
