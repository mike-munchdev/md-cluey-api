const axios = require('axios').default;
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const { createAuthenticationResponse } = require('../utils/responses');
const User = require('../models/User');

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
        if (facebookId && facebookAuthToken) {
          const response = await axios.get(
            `https://graph.facebook.com/me?access_token=${facebookAuthToken}&fields=id,first_name,last_name,email`
          );

          const { id, email } = response.data;
          user = await User.findOne({
            facebookId: id,
            email,
          }).populate({
            path: 'companyResponses',
            populate: {
              path: 'company',
            },
          });

          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);
        } else if (googleAuthToken && googleId) {
          const response = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAuthToken}`
          );

          const { id, email } = response.data;
          user = await User.findOne({
            facebookId: id,
            email,
          }).populate({
            path: 'companyResponses',
            populate: {
              path: 'company',
            },
          });

          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);
        } else {
          user = await User.findOne({ email });
          if (!user.isActive)
            throw new Error(ERRORS.USER.ACCOUNT_NOT_ACTIVATED);

          if (!user) throw new Error(ERRORS.USER.EMAIL_AND_PASSWORD_INCORRECT);

          const isMatch = await comparePassword({
            password: user.password,
            candidatePassword: password,
          });

          if (!isMatch)
            throw new Error(ERRORS.USER.EMAIL_AND_PASSWORD_INCORRECT);
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
