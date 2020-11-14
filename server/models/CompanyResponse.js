const mongoose = require('mongoose');

const { companyResponseEnum } = require('../utils/enum');
const { transformCompany } = require('../utils/transform');

const Schema = mongoose.Schema;

const CompanyResponseSchema = new Schema(
  {
    user: {
      ref: 'User',
      type: Schema.Types.ObjectId,
    },
    company: {
      ref: 'Company',
      type: Schema.Types.ObjectId,
    },
    response: {
      type: String,
      enum: companyResponseEnum,
    },
  },
  { timestamps: true }
);

CompanyResponseSchema.method('transform', function () {
  let obj = this.toObject();

  const company = transformCompany(obj.company);
  obj.company = company;
  // obj.company.id = obj.company._id;
  obj.companyId = obj.company._id;

  //Rename fields
  obj.id = obj._id;
  delete obj._id;

  return obj;
});

module.exports = mongoose.model('CompanyResponse', CompanyResponseSchema);
