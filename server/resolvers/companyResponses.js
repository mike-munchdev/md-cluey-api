const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');

const CompanyResponse = require('../models/CompanyResponse');

const connectDatabase = require('../models/connectDatabase');
const {
  createCompanyResponseResponse,
  createCompanyResponsesResponse,
} = require('../utils/responses');
const { companyResponsePopulate } = require('../utils/populate');

module.exports = {
  Query: {
    getUserCompanyResponses: async (parent, { userId }, {}) => {
      try {
        await connectDatabase();

        // TODO: check for accounts in db for this user/code
        const companyResponses = await CompanyResponse.find({
          user: userId,
        }).populate(companyResponsePopulate);

        if (!companyResponses)
          throw new Error(ERRORS.COMPANY_RESPONSE.NO_RESPONSES_FOUND);

        return createCompanyResponsesResponse({
          ok: true,
          companyResponses: companyResponses.map((c) => c.transform()),
        });
      } catch (error) {
        return createCompanyResponsesResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    getUserCompanyResponse: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { userId, companyId } = input;
        // TODO: check for accounts in db for this user/code
        const companyResponse = await CompanyResponse.findOne({
          user: userId,
          company: companyId,
        }).populate(companyResponsePopulate);

        if (!companyResponse)
          throw new Error(ERRORS.COMPANY_RESPONSE.NO_RESPONSES_FOUND);

        return createCompanyResponseResponse({
          ok: true,
          companyResponse: companyResponse.transform(),
        });
      } catch (error) {
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
  Mutation: {
    addCompanyResponseForUser: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { userId, companyId, response } = input;

        if (!userId || !companyId || !response)
          throw new Error(ERRORS.COMPANY_RESPONSE.INVALID_DATA);

        const companyResponse = await CompanyResponse.create({
          user: userId,
          company: companyId,
          response,
        });

        const returnCompanyResponse = await CompanyResponse.findById(
          companyResponse.id
        ).populate(companyResponsePopulate);

        return createCompanyResponseResponse({
          ok: true,
          companyResponse: returnCompanyResponse.transform(),
        });
      } catch (error) {
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    updateCompanyResponseForUser: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { userId, companyId, responseId, response } = input;

        let companyResponse;
        if (responseId) {
          companyResponse = await CompanyResponse.findByIdAndUpdate(
            responseId,
            { response },
            { upsert: false, new: true }
          );
        } else if (userId && companyId) {
          companyResponse = await CompanyResponse.findOneAndUpdate(
            { user: userId, company: companyId },
            { response },
            { upsert: true, new: true }
          );
        }

        const returnCompanyResponse = await CompanyResponse.findById(
          companyResponse.id
        ).populate(companyResponsePopulate);

        return createCompanyResponseResponse({
          ok: true,
          companyResponse: returnCompanyResponse.transform(),
        });
      } catch (error) {
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    deleteCompanyResponse: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { responseId } = input;

        if (!responseId)
          throw new Error(ERRORS.COMPANY_RESPONSE.NO_RESPONSE_FOUND);

        await CompanyResponse.findOneAndDelete({
          _id: responseId,
        });

        return createCompanyResponseResponse({
          ok: true,
          companyResponse: { id: responseId, response: '' },
        });
      } catch (error) {
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
