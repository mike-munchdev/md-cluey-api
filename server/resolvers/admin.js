const { convertError } = require('../utils/errors');
const asyncForEach = require('../utils/asyncForEach');
const CompanyResponse = require('../models/CompanyResponse');

const connectDatabase = require('../models/connectDatabase');
const { createGeneralResponse } = require('../utils/responses');
const User = require('../models/User');

module.exports = {
  Mutation: {
    adminTransferCompanyResponses: async (parent, {}, { isAdmin }) => {
      try {
        await connectDatabase();

        const users = await User.find({}, 'companyResponses').exists(
          'companyResponses.0'
        );

        await asyncForEach(users, async (user) => {
          const userObject = user.toObject();

          await asyncForEach(
            userObject.companyResponses,
            async (companyResponse) => {
              await CompanyResponse.findOneAndUpdate(
                {
                  company: companyResponse.company,
                  user: userObject._id,
                },
                {
                  user: userObject._id,
                  company: companyResponse.company,
                  response: companyResponse.response,
                },
                { upsert: true }
              );
            }
          );

          //   await User.updateOne({ _id: user._id }, { companyResponses: [] });
          // user.firstName = 'Apple';
          user.companyResponses = new Array();
          await user.save();
        });

        return createGeneralResponse({
          ok: true,
          message: 'Success',
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
