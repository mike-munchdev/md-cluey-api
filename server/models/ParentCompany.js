const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ParentCompanySchema = new Schema(
  {
    airTableId: { type: String },
    name: { type: String, required: true },
    brandUrl: { type: String },
    brandLogoUrl: { type: String },
  },
  { timestamps: true }
);

ParentCompanySchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('ParentCompany', ParentCompanySchema);
