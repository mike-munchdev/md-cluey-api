const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const { createCompaniesResponse } = require('../utils/responses');

const Company = require('../models/Company');

module.exports = {
  Query: {
    getCompaniesByName: async (parent, { name, exact }, context) => {
      try {
        await connectDatabase();
        console.log('getCompaniesByName', name, exact);

        let companies;

        if (exact) {
          companies = await Company.find({ name })
            // .populate('parentCompanies')
            .populate('tags');
        } else {
          //   const $regex = escapeStringRegexp(`/${name}/`);
          //   console.log('$regex', $regex);
          companies = await Company.find({
            name: { $regex: name, $options: 'i' },
          })
            // .populate('parentCompanies')
            .populate('tags');
        }
        console.log('companies', companies);
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
        console.log('getCompaniesByCategory');

        const companies = await Company.find({ categories: id });
        // .populate('parentCompanies')
        // .populate('tags');

        console.log('companies', companies);
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
  },
};
