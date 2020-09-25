const mongoose = require('mongoose');
const Category = require('./Category');

const Schema = mongoose.Schema;

const ProductTypeSchema = new Schema({
  airTableId: { type: String },
  name: { type: String, required: true },
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductType', ProductTypeSchema);
