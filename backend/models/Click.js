const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
  city: { type: String },
  country: { type: String },
  device: { type: String, default: 'desktop' },
  clickedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Click', clickSchema);
