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

module.exports = {
  Query: {
    getCompaniesByName: async (parent, { name, exact }, context) => {
      try {
        await connectDatabase();

        let companies;

        if (exact) {
          companies = await Company.find({ name })
            .populate({
              path: 'parentCompanies',
              populate: {
                path: 'politicalContributions',
              },
            })
            .populate('categories')
            .populate('productTypes')
            .populate('tags');
        } else {
          companies = await Company.find({
            name: { $regex: name, $options: 'i' },
          })
            .populate({
              path: 'parentCompanies',
              populate: {
                path: 'politicalContributions',
              },
            })
            .populate('categories')
            .populate('productTypes')
            .populate('tags');
        }

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

        const companies = await Company.find({ categories: id })
          .populate({
            path: 'parentCompanies',
            populate: {
              path: 'politicalContributions',
            },
          })
          .populate('categories')
          .populate('productTypes')
          .populate('tags');

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

        const companies = await Company.find({ productTypes: id })
          .populate({
            path: 'parentCompanies',
            populate: {
              path: 'politicalContributions',
            },
          })
          .populate('categories')
          .populate('productTypes')
          .populate('tags');

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

        const company = await Company.findById(id)
          .populate({
            path: 'parentCompanies',
            populate: {
              path: 'politicalContributions',
            },
          })
          .populate('categories')
          .populate('productTypes')
          .populate('tags');

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
