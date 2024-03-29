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

        // if (!exact && name.length < 3)
        //   throw new Error(ERRORS.PRODUCT.SEARCH_TEXT_LENGTH_TOO_SHORT);
        let products;

        const nameQuery = exact
          ? { name }
          : {
              name: { $regex: name, $options: 'i' },
            };

        products = await Product.find(nameQuery)
          .populate('brand')
          .populate('productType')
          .populate('parentCompanies')
          .populate('tags');

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
