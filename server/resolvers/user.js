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
  createFriendsResponse,
} = require('../utils/responses');
const { RESPONSES } = require('../constants/responses');
const { pick, omit } = require('lodash');
const Company = require('../models/Company');
const { sendMail } = require('../utils/mail');
const { isUserNameUnique } = require('../utils/users');
const { companyResponsesPopulate } = require('../utils/populate');
const { connect } = require('mongoose');
const Friends = require('../models/Friends');
const { request } = require('express');
const { friendshipEnum } = require('../utils/enum');

module.exports = {
  Query: {
    getUserFriends: async (parent, { userId }, { isAdmin }) => {
      try {
        await connectDatabase();
        const user = await User.findById(userId, 'friends');

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        const users = await User.find(
          { _id: { $in: user.friends } },
          'username firstName lastName'
        );

        return createFriendsResponse({
          ok: true,
          friends: users.map((u) => u.transform()),
        });
      } catch (error) {
        return createFriendsResponse({
          ok: true,
          error: convertError(error),
        });
      }
    },
    getPublicAndActiveUsersByName: async (
      parent,
      { exact, name },
      { isAdmin }
    ) => {
      try {
        await connectDatabase();
        let users;
        if (exact) {
          users = await User.find(
            {
              isActive: true,
              isProfilePublic: true,
              $or: [
                { username: name },
                { firstName: name },
                { lastName: name },
              ],
            },
            'username firstName lastName'
          ).limit(
            process.env.FRIEND_SEARCH_LIMIT
              ? parseInt(process.env.FRIEND_SEARCH_LIMIT)
              : 50
          );
        } else {
          users = await User.find(
            {
              isActive: true,
              isProfilePublic: true,
              $or: [
                { username: { $regex: name, $options: 'i' } },
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } },
              ],
            },
            'username firstName lastName'
          ).limit(
            process.env.FRIEND_SEARCH_LIMIT
              ? parseInt(process.env.FRIEND_SEARCH_LIMIT)
              : 50
          );
        }
        return createFriendsResponse({
          ok: true,
          friends: users.map((u) => u.transform()),
        });
      } catch (error) {
        return createFriendsResponse({
          ok: true,
          error: convertError(error),
        });
      }
    },
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

        // TODO: check for accounts in db for this user/code
        const user = await User.findById(userId).populate(
          companyResponsesPopulate
        );

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        return createCompanyResponsesResponse({
          ok: true,
          companyResponses: user.companyResponses.map((c) => c.transform()),
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
        const { userId, username } = input;

        if (!userId) throw new Error(ERRORS.USER.NOT_FOUND);
        await connectDatabase();
        if (username) {
          const userNameUnique = await isUserNameUnique(userId, username);
          if (!userNameUnique)
            throw new Error(ERRORS.USER.USERNAME_ALREADY_TAKEN);
        }

        await User.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          omit(input, ['userId']),
          {
            upsert: false,
          }
        );

        const user = await User.findById(userId).populate(
          companyResponsesPopulate
        );

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

        let isActive = false;
        if (facebookId && facebookAuthToken) {
          // TODO: check for unique facebookId
          const userWithFacebookIdCount = await User.countDocuments({
            facebookId,
          });
          if (userWithFacebookIdCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_FACEBOOK_TAKEN);
          isActive = true;
        } else if (googleAuthToken && googleId) {
          // TODO: check for unique facebookId
          const userWithGoogleIdCount = await User.countDocuments({
            googleId,
          });
          if (userWithGoogleIdCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_GOOGLE_TAKEN);
          isActive = true;
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
          isActive,
          confirmToken:
            facebookId || googleId
              ? null
              : randomstring.generate({
                  length: 6,
                  charset: 'alphanumeric',
                }),
        });

        if (!facebookId && !googleId) {
          // TODO: add mail to queue
          const mail = await Mail.create({
            mailFrom: process.env.MAIL_FROM_ADDRESS,
            mailTo: user.email,
            subject: RESPONSES.EMAIL.SIGN_UP_EMAIL.subject,
            html: RESPONSES.EMAIL.SIGN_UP_EMAIL.body.replace(
              '{CONFIRM_CODE}',
              `${user.confirmToken}`
            ),
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

        let user = await User.findById(userId).populate(
          companyResponsesPopulate
        );

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
        } else {
          user.companyResponses.push({ company: company._id, response });
          returnIndex = user.companyResponses.length - 1;
        }

        await user.save();

        const returnUser = await User.findById(userId).populate(
          companyResponsesPopulate
        );

        return createCompanyResponseResponse({
          ok: true,
          companyResponse: returnUser.companyResponses[returnIndex].transform(),
        });
      } catch (error) {
        return createCompanyResponseResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },

    requestFriendship: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();
        const { requestorId, recipientId } = input;

        const existingFriendship = await Friends.findOne({
          requester: requestorId,
          recipient: recipientId,
        });

        if (existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.EXISTING_FRIENDSHIP_REQUEST);

        const friendship = new Friends();
        friendship.requester = requestorId;
        friendship.recipient = recipientId;
        friendship.status = friendshipEnum[0];

        friendship.save();

        await User.updateMany(
          {
            $or: [{ _id: requestorId }, { _id: recipientId }],
          },
          { friends: friendship }
        );

        const user = await User.findById(requestorId).populate(
          companyResponsesPopulate
        );
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
  },
};
