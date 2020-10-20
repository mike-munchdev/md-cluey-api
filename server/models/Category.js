const mongoose = require('mongoose');
const ProductType = require('./ProductType');

const Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String },
    productTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ProductType',
      },
    ],
    isActive: { type: Boolean },
  },
  { timestamps: true }
);

CategorySchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  delete obj._id;

  return obj;
});

module.exports = mongoose.model('Category', CategorySchema);
