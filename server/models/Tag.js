const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TagSchema = new Schema(
  {
    airTableId: { type: String },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tag', TagSchema);
