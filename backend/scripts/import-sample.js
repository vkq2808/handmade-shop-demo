/*
  Import sample data from backend/sample_data into MongoDB.
  - Understands MongoDB Extended JSON ($oid/$date)
  - Validates via Mongoose models
  - Options:
      --drop        Drop collections before inserting
      --users       Import users only
      --categories  Import categories only
      --orders      Import orders only
      --dry-run     Parse/validate only, no DB writes
*/

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

const SAMPLE_DIR = path.resolve(__dirname, '..', 'sample_data');

// Normalizers to align data with current models and enums
function normalizeUser(u) {
  return {
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    role: 'user',
    isActive: true,
    avatar: '',
    isEmailVerified: false,
    ...u,
  };
}

function normalizeCategory(c) {
  return {
    description: '',
    isActive: true,
    ...c,
  };
}

function mapOrderStatus(s) {
  if (!s) return 'pending';
  const x = String(s).toLowerCase();
  if (x === 'confirmed') return 'processing';
  if (x === 'completed') return 'delivered';
  if (x === 'canceled') return 'cancelled';
  return s; // keep original if already valid
}

function normalizeOrder(o) {
  const allowedPayments = new Set(['COD', 'MoMo', 'PayPal']);
  const payment = allowedPayments.has(o.paymentMethod) ? o.paymentMethod : 'COD';
  const items = Array.isArray(o.items)
    ? o.items.map((it) => ({
      quantity: 1,
      ...it,
    }))
    : [];
  return {
    status: 'pending',
    isPaid: false,
    paymentMethod: payment,
    ...o,
    status: mapOrderStatus(o.status),
    items,
  };
}

function convertExtended(json) {
  if (Array.isArray(json)) return json.map(convertExtended);
  if (json && typeof json === 'object') {
    const keys = Object.keys(json);
    if (keys.length === 1 && keys[0] === '$oid') {
      return new mongoose.Types.ObjectId(json.$oid);
    }
    if (keys.length === 1 && keys[0] === '$date') {
      return new Date(json.$date);
    }
    const out = {};
    for (const [k, v] of Object.entries(json)) out[k] = convertExtended(v);
    return out;
  }
  return json;
}

async function readJson(file) {
  const raw = await fs.readFile(file, 'utf8');
  const data = JSON.parse(raw);
  return convertExtended(data);
}

function want(section, flags) {
  const anySpecific = flags.users || flags.categories || flags.products || flags.orders;
  if (!anySpecific) return true;
  return !!flags[section];
}

// Helpers to align with Product model pre-save behaviors for insertMany
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

function tryParseObjectIdLike(val) {
  if (val && typeof val === 'string') {
    const m = val.match(/ObjectId\(['\"]?([0-9a-fA-F]{24})['\"]?\)/);
    if (m) return new mongoose.Types.ObjectId(m[1]);
    if (/^[0-9a-fA-F]{24}$/.test(val)) return new mongoose.Types.ObjectId(val);
  }
  return val;
}

function makeUniqueSlugs(products) {
  const seen = new Map();
  return products.map((p) => {
    const base = p.slug && typeof p.slug === 'string' && p.slug.trim().length ? p.slug : toSlug(p.name || '');
    if (!base) return { ...p, slug: '' };
    let candidate = base;
    let i = 1;
    while (seen.has(candidate)) {
      candidate = `${base}-${i++}`;
    }
    seen.set(candidate, true);
    return { ...p, slug: candidate };
  });
}

function normalizeProduct(p) {
  let category = p.category;
  if (category && typeof category === 'string') category = tryParseObjectIdLike(category);
  const isFeatured = typeof p.isFeatured === 'boolean' ? p.isFeatured : (p.isFeartured || false);
  const nameNormalized = normalizeVi(p.name || '');
  return {
    description: '',
    images: [],
    stock: 0,
    rate: 0,
    feedbacks: [],
    ...p,
    category,
    isFeatured,
    nameNormalized,
  };
}

async function main() {
  const flags = Object.fromEntries(
    process.argv.slice(2).map((a) => [a.replace(/^--/, ''), true])
  );

  console.log('Reading sample data...');
  const jobs = [];
  if (want('users', flags)) jobs.push(readJson(path.join(SAMPLE_DIR, 'HM.users.json')));
  else jobs.push(Promise.resolve(null));
  if (want('categories', flags)) jobs.push(readJson(path.join(SAMPLE_DIR, 'HM.categories.json')));
  else jobs.push(Promise.resolve(null));
  if (want('products', flags)) jobs.push(readJson(path.join(SAMPLE_DIR, 'HM.products.json')));
  else jobs.push(Promise.resolve(null));
  if (want('orders', flags)) jobs.push(readJson(path.join(SAMPLE_DIR, 'HM.orders.json')));
  else jobs.push(Promise.resolve(null));

  let [users, categories, products, orders] = await Promise.all(jobs);

  // Apply normalization
  if (users) users = users.map(normalizeUser);
  if (categories) categories = categories.map(normalizeCategory);
  if (products) products = makeUniqueSlugs(products.map(normalizeProduct));
  if (orders) orders = orders.map(normalizeOrder);

  console.log('Parsed:', {
    users: users ? users.length : 0,
    categories: categories ? categories.length : 0,
    products: products ? products.length : 0,
    orders: orders ? orders.length : 0,
  });

  if (flags['dry-run']) {
    console.log('Dry run complete. No database writes performed.');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in environment. Create .env with MONGODB_URI=...');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  try {
    if (flags.drop) {
      console.log('Dropping target collections...');
      const drops = [];
      if (users) drops.push(User.deleteMany({}));
      if (categories) drops.push(Category.deleteMany({}));
      if (products) drops.push(Product.deleteMany({}));
      if (orders) drops.push(Order.deleteMany({}));
      await Promise.all(drops);
    }

    const results = {};
    if (users) {
      // Insert users first for reference integrity
      const res = await User.insertMany(users, { ordered: false });
      results.users = res.length;
      console.log(`Inserted users: ${res.length}`);
    }
    if (categories) {
      const res = await Category.insertMany(categories, { ordered: false });
      results.categories = res.length;
      console.log(`Inserted categories: ${res.length}`);
    }
    if (products) {
      const res = await Product.insertMany(products, { ordered: false });
      results.products = res.length;
      console.log(`Inserted products: ${res.length}`);
    }
    if (orders) {
      const res = await Order.insertMany(orders, { ordered: false });
      results.orders = res.length;
      console.log(`Inserted orders: ${res.length}`);
    }

    console.log('Done.', results);
  } catch (err) {
    console.error('Import encountered an error:', err && err.message ? err.message : err);
    if (err && err.writeErrors) {
      console.error(`Write errors: ${err.writeErrors.length}`);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
