const mongoose = require('mongoose');
const Category = require('./Category');

const Schema = mongoose.Schema;

const ProductTypeSchema = new Schema(
  {
    airTableId: { type: String },
    name: { type: String, required: true },
    isActive: { type: Boolean },
  },
  { timestamps: true }
);

ProductTypeSchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('ProductType', ProductTypeSchema);
