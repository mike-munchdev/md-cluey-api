const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');

const connectDatabase = require('../models/connectDatabase');
const { createGeneralResponse } = require('../utils/responses');

const {
  importProductTypes,
  importParentCompanies,
  importTags,
  importProducts,
  importCompanies,
  importCategories,
  importLogos,
} = require('../utils/bases');

module.exports = {
  Mutation: {
    importAll: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);

        await importCategories();
        await importProductTypes();
        await importCompanies();
        await importParentCompanies();
        await importTags();
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
    importCategories: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);

        await importCategories();

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
    importCompanies: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);

        await importCompanies();

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
    importLogos: async (parent, input, { isAdmin }) => {
      try {
        await connectDatabase();

        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);

        await importLogos();

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
