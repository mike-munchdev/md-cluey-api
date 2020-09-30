const mongoose = require('mongoose');
const Category = require('./Category');

const Schema = mongoose.Schema;

const ProductTypeSchema = new Schema({
  airTableId: { type: String },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProductTypeSchema.method('transform', function () {
  let obj = this.toObject();
  console.log('ProductTypeSchema: transform');
  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('ProductType', ProductTypeSchema);
