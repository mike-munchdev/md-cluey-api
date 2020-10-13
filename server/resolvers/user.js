const { withFilter } = require('apollo-server-express');
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
  createUsersResponse,
  createFriendshipResponse,

  createUserLiteResponse,
} = require('../utils/responses');
const { RESPONSES } = require('../constants/responses');
const { pick, omit } = require('lodash');
const Company = require('../models/Company');
const { sendMail } = require('../utils/mail');
const { isUserNameUnique } = require('../utils/users');
const {
  companyResponsesPopulate,
  friendshipPopulate,
} = require('../utils/populate');
const { connect } = require('mongoose');
const Friends = require('../models/Friends');
const { request } = require('express');
const { friendshipEnum, notificationTypeEnum } = require('../utils/enum');
const { updateFriendshipRequest } = require('../utils/friend');
const { addNotification } = require('../utils/notification');

module.exports = {
  Query: {
    getUserFriends: async (parent, { userId }, { isAdmin }) => {
      try {
        await connectDatabase();
        const user = await User.findById(userId, 'friends');

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        console.log('user', user);

        const friendships = await Friends.find({
          _id: { $in: user.friends },
          status: friendshipEnum[2],
        }).populate(friendshipPopulate);

        console.log('friendships', friendships);

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
      { isAdmin, user }
    ) => {
      try {
        await connectDatabase();
        let users;

        const me = await User.findById(user.id, 'friends');

        const friendships = await Friends.find({
          _id: { $in: me.friends },
          status: friendshipEnum[2],
        }).populate(friendshipPopulate);

        const friendIds = friendships.map((f) => {
          const friend = f.requester.id === user.id ? f.recipient : f.requester;
          return friend.id;
        });
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

        console.log('users', users);
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

    deleteFriendshipById: async (parent, { friendshipId }, { isAdmin }) => {
      try {
        await connectDatabase();
        console.log('friendshipId', friendshipId);
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

    acceptFriendship: async (parent, { friendshipId }, { isAdmin }) => {
      try {
        await connectDatabase();

        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        console.log('existingFriendship', existingFriendship);
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
    rejectFriendship: async (parent, { friendshipId }, { isAdmin }) => {
      try {
        await connectDatabase();

        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        console.log('existingFriendship', existingFriendship);
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
    requestFriendship: async (parent, { input }, { isAdmin }) => {
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
