const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');

const connectDatabase = require('../models/connectDatabase');
const { createGeneralResponse } = require('../utils/responses');

const {
  importProductTypes,
  importParentCompanies,
  importTags,
  importProducts,
  importBrands,
  importBases,
} = require('../utils/bases');

module.exports = {
  Mutation: {
    importBases: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importBases');
        await importBases();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    importProducts: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importProducts');
        await importProducts();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    importProductTypes: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importProductTypes');
        await importProductTypes();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    importTags: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importTags');
        await importTags();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    importParentCompanies: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importParentCompanies');
        await importParentCompanies();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    importBrands: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);
        console.log('importBrands');
        await importBrands();

        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
