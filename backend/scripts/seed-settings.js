/*
  Seed default public content (promotions & policies) into Settings collection.
  Usage:
    node scripts/seed-settings.js          # replace existing with defaults
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Settings = require('../models/Settings');

const DEFAULT_PROMOTIONS = [
  {
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
    link: '/products',
    title: 'Ưu đãi mùa này',
    subtitle: 'Giảm giá cho sản phẩm thủ công chọn lọc',
  },
  {
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop',
    link: '/products?sort=newest',
    title: 'Hàng mới về',
    subtitle: 'Khám phá thiết kế mới nhất',
  },
];

const DEFAULT_POLICIES = [
  { title: 'Miễn phí vận chuyển', description: 'Cho đơn từ 500K tại TP.HCM', icon: '🚚' },
  { title: 'Đổi trả dễ dàng', description: 'Trong 7 ngày nếu lỗi do nhà sản xuất', icon: '🔁' },
  { title: 'Thanh toán an toàn', description: 'Hỗ trợ COD và ví điện tử', icon: '🔒' },
  { title: 'Hỗ trợ 24/7', description: 'Liên hệ qua chat hoặc hotline', icon: '💬' },
];

async function getOrCreateSettings() {
  let doc = await Settings.findOne();
  if (!doc) doc = await Settings.create({ promotions: [], policies: [] });
  return doc;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  try {
    const settings = await getOrCreateSettings();
    settings.promotions = DEFAULT_PROMOTIONS;
    settings.policies = DEFAULT_POLICIES;
    await settings.save();
    console.log('✅ Settings seeded successfully.');
    console.log({ promotions: settings.promotions.length, policies: settings.policies.length });
  } catch (e) {
    console.error('❌ Failed to seed settings:', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
