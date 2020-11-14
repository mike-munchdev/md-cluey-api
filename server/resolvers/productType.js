const { convertError } = require('../utils/errors');
const connectDatabase = require('../models/connectDatabase');
const { createProductTypesResponse } = require('../utils/responses');

const Category = require('../models/Category');

module.exports = {
  Query: {
    getProductTypesByCategory: async (parent, { id }) => {
      try {
        await connectDatabase();

        const categories = await Category.findById(id, 'productTypes').populate(
          'productTypes'
        );

        return createProductTypesResponse({
          ok: true,
          productTypes: categories.productTypes
            ? categories.productTypes.map((p) => p.transform())
            : [],
        });
      } catch (error) {
        return createProductTypesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
