const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const {
  createCompaniesResponse,
  createCompanyResponse,
} = require('../utils/responses');

const Company = require('../models/Company');
const { companyPopulate } = require('../utils/populate');

module.exports = {
  Query: {
    getCompaniesByName: async (parent, { name, exact }, context) => {
      try {
        await connectDatabase();

        let companies;

        const nameQuery = exact
          ? { name }
          : {
              name: { $regex: name, $options: 'i' },
            };

        companies = await Company.find(nameQuery).populate(companyPopulate);

        return createCompaniesResponse({
          ok: true,
          companies: companies ? companies.map((c) => c.transform()) : [],
          searchText: name,
        });
      } catch (error) {
        return createCompaniesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    getCompaniesByCategory: async (parent, { id }, context) => {
      try {
        await connectDatabase();

        const companies = await Company.find({ categories: id }).populate(
          companyPopulate
        );

        return createCompaniesResponse({
          ok: true,
          companies: companies ? companies.map((c) => c.transform()) : [],
        });
      } catch (error) {
        return createCompaniesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    getCompaniesByProductType: async (parent, { id }, context) => {
      try {
        await connectDatabase();

        const companies = await Company.find({ productTypes: id }).populate(
          companyPopulate
        );

        return createCompaniesResponse({
          ok: true,
          companies: companies ? companies.map((c) => c.transform()) : [],
        });
      } catch (error) {
        return createCompaniesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    getCompanyById: async (parent, { id }, context) => {
      try {
        await connectDatabase();

        const company = await Company.findById(id).populate(companyPopulate);

        if (!company)
          throw new Error(ERRORS.COMPANY.NOT_FOUND_WITH_PROVIDED_INFO);

        return createCompanyResponse({
          ok: true,
          company: company.transform(),
        });
      } catch (error) {
        return createCompanyResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
