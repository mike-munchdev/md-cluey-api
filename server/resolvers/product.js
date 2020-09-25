const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const {
  createAuthenticationResponse,
  createProductsResponse,
} = require('../utils/responses');
const User = require('../models/User');
const Product = require('../models/Product');

module.exports = {
  Query: {
    getProductsByName: async (parent, { name, exact }, context) => {
      try {
        await connectDatabase();
        console.log('getProductsByName', name, exact);
        // if (!exact && name.length < 3)
        //   throw new Error(ERRORS.PRODUCT.SEARCH_TEXT_LENGTH_TOO_SHORT);
        let products;

        if (exact) {
          products = await Product.find({ name })
            .populate('brand')
            .populate('productType')
            .populate('parentCompanies')
            .populate('tags');
        } else {
          //   const $regex = escapeStringRegexp(`/${name}/`);
          //   console.log('$regex', $regex);
          products = await Product.find({
            name: { $regex: name, $options: 'i' },
          })
            .populate('brand')
            .populate('productType')
            .populate('parentCompanies')
            .populate('tags');
        }
        console.log('products', products);
        return createProductsResponse({
          ok: true,
          products: products ? products.map((p) => p.transform()) : [],
          searchText: name,
        });
      } catch (error) {
        return createProductsResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
