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
const { validateToken, decodeAppleToken } = require('../utils/authentication');

module.exports = {
  Query: {
    getUserFriends: async (parent, { userId }, {}) => {
      try {
        await connectDatabase();
        const user = await User.findById(userId, 'friends');

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        const friendships = await Friends.find({
          _id: { $in: user.friends },
          status: friendshipEnum[2],
        }).populate(friendshipPopulate);

        return createFriendshipsResponse({
          ok: true,
          friendships: friendships.map((f) => f.transform()),
        });
      } catch (error) {
        return createFriendshipsResponse({
          ok: true,
          error: convertError(error),
        });
      }
    },
    getPublicAndActiveNonFriendsByName: async (
      parent,
      { exact, name },
      { user }
    ) => {
      try {
        await connectDatabase();
        let users;

        const me = await User.findById(user.id, 'friends');

        const friendships = await Friends.find({
          _id: { $in: me.friends },
          status: friendshipEnum[2],
        }).populate(friendshipPopulate);

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
              $or: orQuery,
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

        return createUserLiteResponse({
          ok: true,
          users: users.map((u) => u.transform()),
          searchText: name,
        });
      } catch (error) {
        return createUserLiteResponse({
          ok: true,
          error: convertError(error),
        });
      }
    },
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
    getUserCompanyResponses: async (parent, { userId }, {}) => {
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
        let message = RESPONSES.USER.SIGNUP_SUCCESSFUL_SOCIAL;
        let saveEmail;
        if (appleId || appleIdentityToken) {
          console.log(
            'calling decodeAppleToken',
            appleId,
            appleIdentityToken,
            appleAuthToken
          );
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

        console.log('saveEmail', saveEmail);
        isActive =
          (appleId && appleAuthToken && appleIdentityToken) ||
          (facebookId && facebookAuthToken) ||
          (googleAuthToken && googleId)
            ? true
            : false;

        // TODO: add user to database as inactive
        const user = await User.create({
          ...input,
          email: saveEmail,
          isActive,
          confirmToken:
            facebookId || googleId
              ? null
              : randomstring.generate({
                  length: 6,
                  charset: 'alphanumeric',
                }),
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

    activateUserAccount: async (parent, { confirmToken }, {}) => {
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

    updateCompanyResponseForUser: async (parent, { input }, {}) => {
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

    deleteFriendshipById: async (parent, { friendshipId }, {}) => {
      try {
        await connectDatabase();

        // delete friendship record
        await Friends.findByIdAndDelete(friendshipId);

        // remove all instances of this from the users
        await User.updateMany({}, { $pull: { friends: friendshipId } });
        // remove all instances of this from the notifications
        await SystemNotification.findOneAndDelete({}, { linkId: friendshipId });

        return createGeneralResponse({
          ok: true,
          message: RESPONSES.FRIENDSHIP.REQUEST_DELETED,
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },

    acceptFriendship: async (parent, { friendshipId }, {}) => {
      try {
        await connectDatabase();

        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        existingFriendship = await updateFriendshipRequest(
          existingFriendship,
          friendshipEnum[2]
        );

        // add notification
        await addNotification(
          existingFriendship.requester,
          `${existingFriendship.recipient.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_ACCEPTED}`,
          notificationTypeEnum[0],
          existingFriendship._id
        );

        return createFriendshipResponse({
          ok: true,
          friendship: existingFriendship.transform(),
        });
      } catch (error) {
        return createFriendshipResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    rejectFriendship: async (parent, { friendshipId }, {}) => {
      try {
        await connectDatabase();

        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        existingFriendship = await updateFriendshipRequest(
          existingFriendship,
          friendshipEnum[3]
        );

        // add notification
        await addNotification(
          existingFriendship.requester,
          `${existingFriendship.recipient.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_ACCEPTED}`,
          notificationTypeEnum[0],
          existingFriendship._id
        );

        return createFriendshipResponse({
          ok: true,
          friendship: existingFriendship.transform(),
        });
      } catch (error) {
        return createFriendshipResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    requestFriendship: async (parent, { input }, {}) => {
      try {
        await connectDatabase();
        const { requestorId, recipientId } = input;

        const existingFriendship = await Friends.findOne({
          $or: [
            { requester: requestorId, recipient: recipientId },
            { requester: recipientId, recipient: requestorId },
          ],
        });

        if (existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.EXISTING_FRIENDSHIP_REQUEST);

        const friendship = new Friends();
        friendship.requester = requestorId;
        friendship.recipient = recipientId;
        friendship.status = friendshipEnum[0];

        await friendship.save();

        await User.updateMany(
          {
            $or: [{ _id: requestorId }, { _id: recipientId }],
          },
          { $push: { friends: friendship } }
        );

        const user = await User.findById(requestorId).populate(
          companyResponsesPopulate
        );
        // add notification
        const notification = new SystemNotification();

        notification.user = recipientId;
        notification.message = `${user.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_PENDING}`;
        notification.notificationType = notificationTypeEnum[0];
        notification.linkId = friendship._id;
        await notification.save();

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
