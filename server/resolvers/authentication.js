const axios = require('axios').default;
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const { createAuthenticationResponse } = require('../utils/responses');
const User = require('../models/User');
const {
  companyResponse,
  companyResponsesPopulate,
} = require('../utils/populate');
const { assignWith } = require('lodash');

module.exports = {
  Query: {
    getUserToken: async (
      parent,
      {
        email,
        password,
        facebookId,
        facebookAuthToken,
        googleAuthToken,
        googleId,
      },
      context
    ) => {
      try {
        await connectDatabase();

        let user;
        if (facebookId || facebookAuthToken) {
          const response = await axios.get(
            `https://graph.facebook.com/me?access_token=${facebookAuthToken}&fields=id,first_name,last_name,email`
          );

          user = await User.findOne({
            email: response.data.email,
          }).populate(companyResponsesPopulate);

          if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);
          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);

          if (user.isAccountLocked) throw new Error(ERRORS.USER.ACCOUNT_LOCKED);
        } else if (googleAuthToken || googleId) {
          const response = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAuthToken}`
          );

          user = await User.findOne({
            // facebookId: id,
            email: response.data.email,
          }).populate(companyResponsesPopulate);

          if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);
          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);
          if (user.isAccountLocked) throw new Error(ERRORS.USER.ACCOUNT_LOCKED);
        } else {
          user = await User.findOne({ email }).populate(
            companyResponsesPopulate
          );
          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);

          if (!user) throw new Error(ERRORS.USER.EMAIL_AND_PASSWORD_INCORRECT);
          if (user.isAccountLocked) throw new Error(ERRORS.USER.ACCOUNT_LOCKED);

          const isMatch = await comparePassword({
            password: user.password,
            candidatePassword: password,
          });

          if (!isMatch) {
            let failedAttempts = user.failedLoginAttempts || 0;
            failedAttempts++;

            user.failedLoginAttempts = failedAttempts;

            const remainingAttempts =
              Number(process.env.FAILED_LOGIN_ATTEPTS_MAX) - failedAttempts;

            if (remainingAttempts <= 0) {
              user.isAccountLocked = true;
              await user.save();
              throw new Error(ERRORS.USER.ACCOUNT_LOCKED);
            } else {
              await user.save();
              throw new Error(
                `${ERRORS.USER.EMAIL_AND_PASSWORD_INCORRECT_FAILED_ATTEMPTS.replace(
                  '<REMAINING_ATTEMPTS>',
                  remainingAttempts.toString()
                )}`
              );
            }
          }
        }

        const token = await generateToken({
          user: {
            id: user.id,
          },
          type: 'User',
        });

        return createAuthenticationResponse({
          ok: true,
          token,
          user: user.transform(),
        });
      } catch (error) {
        return createAuthenticationResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
