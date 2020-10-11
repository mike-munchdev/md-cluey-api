const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    airTableId: { type: String },
    name: { type: String, required: true },
    productType: {
      type: Schema.Types.ObjectId,
      ref: 'ProductType',
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
  },
  { timestamps: true }
);

ProductSchema.method('transform', function () {
  let obj = this.toObject();

  //Rename fields
  obj.id = obj._id;

  if (obj.productType) {
    obj.productType.id = obj.productType._id;
    delete obj.productType._id;
  }
  if (obj.brand) {
    obj.brand.id = obj.brand._id;
    delete obj.brand._id;
  }

  if (obj.parentCompanies) {
    obj.parentCompanies = obj.parentCompanies.map((c) => {
      c.id = c._id;
      delete c._id;
      return c;
    });
  }
  if (obj.tags) {
    obj.tags = obj.tags.map((t) => {
      t.id = t._id;
      delete t._id;
      return t;
    });
  }

  delete obj._id;

  return obj;
});
module.exports = mongoose.model('Product', ProductSchema);
