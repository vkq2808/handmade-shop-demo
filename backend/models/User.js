const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require("crypto");
const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
function decrypt(encryptedText) {
  if (!encryptedText) return "";
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(":");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên người dùng']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    match: [/.+\@.+\..+/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  zipCode: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  // Thời điểm gần nhất đã gửi email xác thực (để giới hạn tần suất gửi lại)
  lastVerificationEmailSentAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
  ,
  // Danh sách sản phẩm yêu thích của người dùng
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ]
}, { timestamps: true });
userSchema.pre("save", function (next) {
  if (this.isModified("phone")) this.phone = encrypt(this.phone);
  if (this.isModified("address")) this.address = encrypt(this.address);
  next();
});
userSchema.path("phone").get(function (value) {
  return decrypt(value);
});

userSchema.path("address").get(function (value) {
  return decrypt(value);
});
userSchema.set("toObject", { getters: true });
userSchema.set("toJSON", { getters: true });

module.exports = mongoose.model('User', userSchema);
