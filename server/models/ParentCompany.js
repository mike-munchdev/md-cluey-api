const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const politicalContributionSchema = new Schema({
  cycle: { type: Number },
  orgId: { type: String },
  orgName: { type: String },
  subsidiaryId: { type: String },
  subsidiary: { type: String },
  total: { type: Number },
  indivs: { type: Number },
  pacs: { type: Number },
  democrats: { type: Number },
  republicans: { type: Number },
  thirdParty: { type: Number },
});

const ParentCompanySchema = new Schema({
  airTableId: { type: String },
  name: { type: String, required: true },
  brandUrl: { type: String },
  brandLogoUrl: { type: String },
  orgId: { type: String },
  politicalContributions: [politicalContributionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ParentCompanySchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('ParentCompany', ParentCompanySchema);
