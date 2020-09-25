const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TagSchema = new Schema({
  airTableId: { type: String },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', TagSchema);
