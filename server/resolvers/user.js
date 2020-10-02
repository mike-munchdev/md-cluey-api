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
  createCompanyResponsesResponse,
} = require('../utils/responses');
const { RESPONSES } = require('../constants/responses');
const { pick, omit } = require('lodash');
const Company = require('../models/Company');
const { sendMail } = require('../utils/mail');

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
    getUserCompanyResponses: async (parent, { userId }, { isAdmin }) => {
      try {
        await connectDatabase();

        console.log('getUserCompanyResponses', userId);
        // TODO: check for accounts in db for this user/code
        const user = await User.findById(userId).populate({
          path: 'companyResponses',
          populate: {
            path: 'company',
          },
        });

        console.log('user', user.companyResponses);
        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        return createCompanyResponsesResponse({
          ok: true,
          companyResponses: user.companyResponses,
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
    updateUserPassword: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();
        // TODO: check for accounts in db for this user/code

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

        if (!userId) throw new Error(ERRORS.USER.NOT_FOUND);
        await connectDatabase();

        await User.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          omit(input, ['userId']),
          {
            upsert: false,
          }
        );

        const user = await User.findById(userId).populate({
          path: 'companyResponses',
          populate: {
            path: 'company',
          },
        });

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
          active: facebookId || googleId,
          confirmToken:
            !facebookId && !googleId
              ? null
              : randomstring.generate({
                  length: 12,
                  charset: 'alphanumeric',
                }),
        });

        if (!facebookId && !googleId) {
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

          await sendMail(mail);
        }
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

        console.log('updateCompanyResponseForUser');

        let user = await User.findById(userId).populate({
          path: 'companyResponses',
          populate: {
            path: 'company',
          },
        });

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);
        let company = await Company.findById(companyId);

        if (!company)
          throw new Error(ERRORS.COMPANY.NOT_FOUND_WITH_PROVIDED_INFO);

        const existingResponseIndex = user.companyResponses.findIndex((r) => {
          return r.company._id.toString() === company._id.toString();
        });

        let returnIndex = existingResponseIndex;
        if (existingResponseIndex >= 0) {
          user.companyResponses[existingResponseIndex].response = response;
          user.companyResponses[existingResponseIndex].updatedAt = Date.now();
        } else {
          user.companyResponses.push({ company: company._id, response });
          returnIndex = user.companyResponses.length - 1;
        }

        console.log('user.companyResponses', user.companyResponses);
        await user.save();

        const returnUser = await User.findById(userId).populate({
          path: 'companyResponses',
          populate: {
            path: 'company',
          },
        });
        console.log('returnUser.companyResponses', returnUser.companyResponses);
        return createCompanyResponseResponse({
          ok: true,
          companyResponse: returnUser.companyResponses[returnIndex].transform(),
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
