const { withFilter } = require('apollo-server-express');
const { ObjectId } = require('mongoose').Types;
const randomstring = require('randomstring');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');

const User = require('../models/User');
const Mail = require('../models/Mail');

const connectDatabase = require('../models/connectDatabase');
const {
  createUserResponse,
  createGeneralResponse,
  createCompanyResponseResponse,
} = require('../utils/responses');
const { RESPONSES } = require('../constants/responses');
const { pick, omit } = require('lodash');
const Company = require('../models/Company');

module.exports = {
  Query: {
    getUserById: async (parent, { userId }, { isAdmin }) => {
      try {
        await connectDatabase();

        // TODO: check for accounts in db for this user/code
        const user = await User.findById(userId);

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        return createUserResponse({
          ok: true,
          user,
        });
      } catch (error) {
        return createUserResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
  Mutation: {
    updateUserPassword: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();
        // TODO: check for accounts in db for this user/code
        console.log('updateUserPassword', input);
        let user = await User.findById(input.userId);

        if (!user)
          throw new Error('No user found with the provided information.');

        user.password = input.password;
        user.save();

        return createGeneralResponse({
          ok: true,
          message: RESPONSES.USER.PASSWORD_CHANGED,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    createUser: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();

        let user = await User.create({
          ...input,
        });

        return createUserResponse({
          ok: true,
          user,
        });
      } catch (error) {
        return createUserResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    updateUser: async (parent, { input }, { isAdmin }) => {
      try {
        const { userId } = input;

        console.log('updateUser', input);
        if (!userId) throw new Error(ERRORS.USER.NOT_FOUND);
        await connectDatabase();

        await User.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          omit(input, ['userId']),
          {
            upsert: false,
          }
        );

        const user = await User.findById(userId);

        return createUserResponse({
          ok: true,
          user: user.transform(),
        });
      } catch (error) {
        return createUserResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    userSignup: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();
        const {
          firstName,
          lastName,
          email,
          password,
          facebookId,
          facebookAuthToken,
          googleId,
          googleAuthToken,
        } = input;

        if (facebookId && facebookAuthToken) {
          // TODO: check for unique facebookId
          const userWithFacebookIdCount = await User.countDocuments({
            facebookId,
          });
          if (userWithFacebookIdCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_FACEBOOK_TAKEN);
        } else if (googleAuthToken && googleId) {
          // TODO: check for unique facebookId
          const userWithGoogleIdCount = await User.countDocuments({
            googleId,
          });
          if (userWithGoogleIdCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_GOOGLE_TAKEN);
        } else {
          // TODO: check for unique email
          const userWithEmailCount = await User.countDocuments({
            email,
          });
          if (userWithEmailCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_EMAIL_TAKEN);
        }
        // TODO: add user to database as inactive
        const user = await User.create({
          ...input,
          confirmToken: randomstring.generate({
            length: 12,
            charset: 'alphanumeric',
          }),
        });

        // TODO: add mail to queue
        const mail = await Mail.create({
          mailFrom: process.env.MAIL_FROM_ADDRESS,
          mailTo: user.email,
          subject: RESPONSES.EMAIL.SIGN_UP_EMAIL.subject,
          html: RESPONSES.EMAIL.SIGN_UP_EMAIL.body
            .replace(
              '{REGISTER_URL}',
              `${process.env.REGISTER_URL}/${user.confirmToken}`
            )
            .replace('{COMPANY_INFO}', `${process.env.COMPANY_INFO}`)
            .replace('{SOCIAL_MEDIA_LINKS}', ''),
        });

        return createGeneralResponse({
          ok: true,
          message: RESPONSES.USER.SIGNUP_SUCCESSFUL,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },

    addPushToken: async (parent, { input }, { isAdmin, user }) => {
      try {
        await connectDatabase();

        const { userId, pushToken } = input;
        if (!userId) throw new Error(ERRORS.USER.NOT_FOUND);
        const user = await User.findById(userId);
        if (!user) throw new Error(ERRORS.USER.NOT_FOUND);

        const existingPushToken = user.pushTokens.find((t) => {
          return t === pushToken;
        });

        if (!existingPushToken)
          throw new Error(ERRORS.USER.PUSH_TOKEN_ALREADY_EXISTS);

        user.pushTokens.push(pushToken);

        await user.save();

        const updatedUser = await User.findById(input.userId);

        return createUserResponse({
          ok: true,
          user: updatedUser,
        });
      } catch (error) {
        return createUserResponse({
          ok: false,
          error,
        });
      }
    },
    activateUserAccount: async (parent, { confirmToken }, { isAdmin }) => {
      try {
        await connectDatabase();

        // TODO: check for confirm token
        const user = await User.findOne({ confirmToken });
        if (!user) throw new Error(ERRORS.USER.CONFIRM_TOKEN_NOT_FOUND);

        user.isActive = true;
        user.confirmToken = null;

        await user.save();

        return createGeneralResponse({
          ok: true,
          message: RESPONSES.USER.ACCOUNT_ACTIVATED,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    updateCompanyResponseForUser: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();
        const { userId, companyId, response } = input;
        console.log('input', input);
        // TODO: check for accounts in db for this user/code

        let user = await User.findById(userId).populate({
          path: 'responses',
          populate: {
            path: 'company',
          },
        });

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);
        let company = await Company.findById(companyId);

        if (!company)
          throw new Error(ERRORS.COMPANY.NOT_FOUND_WITH_PROVIDED_INFO);

        const existingResponseIndex = user.responses.findIndex((r) => {
          return r.company._id.toString() === company._id.toString();
        });

        let returnIndex = existingResponseIndex;
        if (existingResponseIndex >= 0) {
          user.responses[existingResponseIndex].response = response;
          user.responses[existingResponseIndex].updatedAt = Date.now();
        } else {
          user.responses.push({ company: company._id, response });
          returnIndex = user.responses.length - 1;
        }

        await user.save();
        console.log('user.responses[returnIndex]', user.responses[returnIndex]);
        return createCompanyResponseResponse({
          ok: true,
          response: user.responses[returnIndex],
        });
      } catch (error) {
        console.log('error', error);
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
