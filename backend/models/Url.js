const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalUrl: { type: String, required: true },
  customUrl: { type: String, default: null },
  shortUrl: { type: String, required: true },
  qrCodeUrl: { type: String },
  expirationTime: { type: Date, default: null },
  is_temporary: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Url', urlSchema);
