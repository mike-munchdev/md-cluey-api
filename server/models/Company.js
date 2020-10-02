const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CompanySchema = new Schema({
  airTableId: { type: String },
  name: { type: String, required: true },
  brandUrl: { type: String },
  brandLogoUrl: { type: String },
  productTypes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ProductType',
    },
  ],
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  parentCompanies: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CompanySchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('Company', CompanySchema);
