const { ObjectId } = require('mongoose').Types;

const randomstring = require('randomstring');
const { ERRORS } = require('../constants/errors');
const { MESSAGES } = require('../constants/messages');
const { convertError } = require('../utils/errors');

const User = require('../models/User');
const Mail = require('../models/Mail');
const SystemNotification = require('../models/SystemNotification');

const connectDatabase = require('../models/connectDatabase');
const {
  createUserResponse,
  createGeneralResponse,
  createCompanyResponseResponse,
  createCompanyResponsesResponse,
  createFriendshipsResponse,
  createFriendshipResponse,
  createUserLiteResponse,
  createAuthenticationResponse,
} = require('../utils/responses');
const { RESPONSES } = require('../constants/responses');
const { omit } = require('lodash');
const Company = require('../models/Company');
const { sendMail } = require('../utils/mail');
const { isUserNameUnique } = require('../utils/users');
const {
  companyResponsesPopulate,
  friendshipPopulate,
} = require('../utils/populate');
const Friends = require('../models/Friends');
const { friendshipEnum, notificationTypeEnum } = require('../utils/enum');
const { updateFriendshipRequest } = require('../utils/friend');
const { addNotification } = require('../utils/notification');
const {
  validateToken,
  decodeAppleToken,
  generateToken,
} = require('../utils/authentication');

module.exports = {
  Query: {
    getUserById: async (parent, { userId }, {}) => {
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
    getPublicAndActiveNonFriendsByName: async (
      parent,
      { exact, name },
      { isAdmin, user }
    ) => {
      try {
        await connectDatabase();
        let users;

        const orQuery = exact
          ? [
              { username: name },
              { firstName: name },
              { lastName: name },
              { nameFilter: name },
            ]
          : [
              { username: { $regex: name, $options: 'i' } },
              { firstName: { $regex: name, $options: 'i' } },
              { lastName: { $regex: name, $options: 'i' } },
              { nameFilter: { $regex: name, $options: 'i' } },
            ];

        users = await User.aggregate([
          {
            $addFields: {
              nameFilter: {
                $concat: ['$firstName', ' ', '$lastName'],
              },
            },
          },
          {
            $match: {
              $and: [{ isActive: true }, { $or: orQuery }],
            },
          },
        ])
          .project({
            username: 1,
            firstName: 1,
            lastName: 1,
            _id: 1,
          })
          .limit(
            process.env.FRIEND_SEARCH_LIMIT
              ? parseInt(process.env.FRIEND_SEARCH_LIMIT)
              : 50
          );

        const usersWithoutMe = users
          .map((u) => {
            u.id = u._id;
            return u;
          })
          .filter((u) => u.id.toString() !== user._id.toString());

        return createUserLiteResponse({
          ok: true,
          users: usersWithoutMe,
          searchText: name,
        });
      } catch (error) {
        return createUserLiteResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
  Mutation: {
    updateUserPassword: async (parent, { input }, {}) => {
      try {
        await connectDatabase();
        // TODO: check for accounts in db for this user/code

        let user = await User.findById(input.userId);

        if (!user)
          throw new Error('No user found with the provided information.');

        user.password = input.password;
        user.mustResetPassword = false;
        await user.save();

        const dbUser = await User.findById(user._id).populate(
          companyResponsesPopulate
        );

        return createUserResponse({
          ok: true,
          user: dbUser.transform(),
        });
      } catch (error) {
        return createUserResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    resetPassword: async (parent, { email }, {}) => {
      try {
        await connectDatabase();
        // TODO: check for accounts in db for this user/code

        let dbUser = await User.findOne({ email });

        if (!dbUser)
          throw new Error('No user found with the provided information.');

        if (dbUser.facebookId || dbUser.googleId)
          throw new Error(
            'User is connected via social platform and cannot reset a password'
          );
        const password = randomstring.generate({
          length: 8,
          charset: 'alphanumeric',
        });

        dbUser.mustResetPassword = true;
        dbUser.password = password;

        await dbUser.save();

        const mail = await Mail.create({
          mailFrom: process.env.MAIL_FROM_ADDRESS,
          mailTo: dbUser.email,
          subject: RESPONSES.EMAIL.RESET_PASSWORD_EMAIL.subject,
          html: RESPONSES.EMAIL.RESET_PASSWORD_EMAIL.body.replace(
            '{TEMPORARY_PASSWORD}',
            `${password}`
          ),
        });
        await sendMail(mail);

        return createGeneralResponse({
          ok: true,
          message: RESPONSES.USER.RESET_PASSWORD,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    createUser: async (parent, { input }, {}) => {
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

    updateUser: async (parent, { input }, {}) => {
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

    userSignup: async (parent, { input }, {}) => {
      try {
        await connectDatabase();
        const {
          email,
          facebookId,
          facebookAuthToken,
          googleId,
          googleAuthToken,
          appleId,
          appleAuthToken,
          appleIdentityToken,
        } = input;

        let isActive = false;
        let message = '';
        let saveEmail;
        if (appleId || appleIdentityToken) {
          const { decodedEmail, sub } = await decodeAppleToken(
            appleIdentityToken
          );

          const userWithAppleIdCount = await User.countDocuments({
            email: decodedEmail,
            appleId: sub,
          });

          saveEmail = decodedEmail;
          if (userWithAppleIdCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_EMAIL_TAKEN);
        } else {
          const userWithEmailCount = await User.countDocuments({
            email,
          });
          if (userWithEmailCount !== 0)
            throw new Error(ERRORS.USER.ACCOUNT_EMAIL_TAKEN);

          saveEmail = email;
        }

        if (!saveEmail) throw new Error('Could not create user account.');

        isActive =
          (appleId && appleAuthToken && appleIdentityToken) ||
          (facebookId && facebookAuthToken) ||
          (googleAuthToken && googleId)
            ? true
            : false;

        const confirmToken =
          facebookId || googleId || appleId
            ? null
            : randomstring.generate({
                length: 6,
                charset: 'alphanumeric',
              });

        // TODO: add user to database as inactive
        const user = await User.create({
          ...input,
          email: saveEmail,
          // username: saveEmail,
          mustResetPassword: facebookId || googleId || appleId ? false : true,
          isActive,
          confirmToken,
        });

        if (!facebookId && !googleId && !appleId) {
          message = RESPONSES.USER.SIGNUP_SUCCESSFUL;
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
        } else {
          message = RESPONSES.USER.SIGNUP_SUCCESSFUL_SOCIAL;
        }

        return createGeneralResponse({
          ok: true,
          message,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },

    addPushToken: async (parent, { input }, {}) => {
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

    activateUserAccount: async (parent, { input }, {}) => {
      try {
        await connectDatabase();
        const { confirmToken, email } = input;

        // TODO: check for confirm token
        let user = await User.findOne({ email });

        if (!user) throw new Error(ERRORS.USER.CONFIRM_TOKEN_NOT_FOUND);
        if (user.confirmToken !== confirmToken)
          throw new Error(ERRORS.USER.CONFIRM_TOKEN_NOT_FOUND);

        user.isActive = true;
        user.confirmToken = null;
        user.mustResetPassword = true;

        await user.save();

        user = await User.findById(user.id).populate(companyResponsesPopulate);

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
