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
  },
  Mutation: {
    updateCompanyResponseForUser: async (parent, { input }, {}) => {
      try {
        await connectDatabase();
        console.log('updateCompanyResponseForUser', input);
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

          console.log('companyResponse', companyResponse);
        }

        const returnCompanyResponse = await CompanyResponse.findById(
          companyResponse.id
        ).populate(companyResponsePopulate);

        console.log('returnCompanyResponse', returnCompanyResponse);
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
        console.log('deleteCompanyResponse', input);
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
