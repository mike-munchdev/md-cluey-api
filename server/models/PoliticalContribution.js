const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PoliticalContributionSchema = new Schema(
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

PoliticalContributionSchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model(
  'PoliticalContribution',
  PoliticalContributionSchema
);
