const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // ID của người giới thiệu (User 1)
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // URL webhook của User nhận thông báo
  webhookUrl: { type: String, default: null },
  // Mã secret dùng để ký webhook payload, giúp User 1 xác thực tính toàn vẹn của request
  webhookSecret: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);