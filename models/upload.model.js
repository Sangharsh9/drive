// models/upload.model.js
const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: String,
  supabasePath: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);
