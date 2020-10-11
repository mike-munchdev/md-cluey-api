const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const politicalContributionSchema = new Schema(
  {
    cycle: { type: Number },
    org_id: { type: String },
    org_name: { type: String },
    total: { type: Number },
    democrats: { type: Number },
    republicans: { type: Number },
    third_party: { type: Number },
    indivs: { type: Number },
    indivs_dems: { type: Number },
    indivs_repubs: { type: Number },
    indivs_third: { type: Number },
    pacs: { type: Number },
    pacs_dems: { type: Number },
    pacs_repubs: { type: Number },
    pacs_third: { type: Number },
  },
  { timestamps: true }
);

const ParentCompanySchema = new Schema(
  {
    airTableId: { type: String },
    name: { type: String, required: true },
    brandUrl: { type: String },
    brandLogoUrl: { type: String },
    orgId: { type: String },
    politicalContributions: [politicalContributionSchema],
  },
  { timestamps: true }
);

ParentCompanySchema.method('transform', function () {
  let obj = this.toObject();
  console.log('ParentCompanySchema transform');
  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('ParentCompany', ParentCompanySchema);
