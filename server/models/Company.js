const mongoose = require('mongoose');
const { transformCompany } = require('../utils/transform');

const Schema = mongoose.Schema;

const CompanySchema = new Schema(
  {
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
    politicalContributions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PoliticalContribution',
      },
    ],

    isActive: { type: Boolean },
  },
  { timestamps: true }
);

CompanySchema.method('transform', function () {
  // let obj = this.toObject();
  return transformCompany(this);
});
module.exports = mongoose.model('Company', CompanySchema);
