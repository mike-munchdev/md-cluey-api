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
      ref: 'ParentCompany',
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CompanySchema.method('transform', function () {
  let obj = this.toObject();
  console.log('CompanySchema transform');
  //Rename fields
  obj.id = obj._id;

  if (obj.productTypes) {
    obj.productTypes = obj.productTypes.map((c) => {
      c.id = c._id;
      // delete c._id;
      return c;
    });
  }

  if (obj.categories) {
    obj.categories = obj.categories.map((c) => {
      c.id = c._id;
      // delete c._id;
      return c;
    });
  }

  if (obj.parentCompanies) {
    obj.parentCompanies = obj.parentCompanies.map((c) => {
      c.id = c._id;
      if (c.politicalContributions) {
        c.politicalContributions = c.politicalContributions.map((p) => {
          p.id = p._id;
          return p;
        });
      }
      return c;
    });
  }

  return obj;
});
module.exports = mongoose.model('Company', CompanySchema);
