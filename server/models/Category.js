const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  brandLogoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
CategorySchema.method('transform', function () {
  let obj = this.toObject();
  // console.log('CompanySchema transform');
  //Rename fields
  obj.id = obj._id;

  // if (obj.parentCompanies) {
  //   obj.parentCompanies = obj.parentCompanies.map((c) => {
  //     c.id = c._id;
  //     delete c._id;
  //     return c;
  //   });
  // }

  delete obj._id;

  return obj;
});

module.exports = mongoose.model('Category', CategorySchema);
