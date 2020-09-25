const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const { createCategoriesResponse } = require('../utils/responses');

const Category = require('../models/Category');

module.exports = {
  Query: {
    getCategories: async (parent, input, context) => {
      try {
        await connectDatabase();

        const categories = await Category.find({});

        console.log('Categories', categories);
        return createCategoriesResponse({
          ok: true,
          categories: categories ? categories.map((c) => c.transform()) : [],
        });
      } catch (error) {
        return createCategoriesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
