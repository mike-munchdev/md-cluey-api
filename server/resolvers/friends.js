const { ERRORS } = require('../constants/errors');
const { MESSAGES } = require('../constants/messages');
const { convertError } = require('../utils/errors');
const { Types } = require('mongoose');
const User = require('../models/User');

const SystemNotification = require('../models/SystemNotification');

const connectDatabase = require('../models/connectDatabase');
const {
  createGeneralResponse,
  createFriendshipsResponse,
  createFriendshipResponse,
} = require('../utils/responses');

const { RESPONSES } = require('../constants/responses');
const { friendshipPopulate } = require('../utils/populate');
const Friends = require('../models/Friends');
const { friendshipEnum, notificationTypeEnum } = require('../utils/enum');
const { updateFriendshipRequest } = require('../utils/friend');
const { addNotification } = require('../utils/notification');

module.exports = {
  Query: {
    getUserFriends: async (parent, { userId }, {}) => {
      try {
        await connectDatabase();

        const user = await User.findById(userId);

        if (!user) throw new Error(ERRORS.USER.NOT_FOUND_WITH_PROVIDED_INFO);

        const friendships = await Friends.find({
          $or: [{ requester: user.id }, { recipient: user.id }],
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
    getFriendshipBetweenUsers: async (parent, { userId1, userId2 }, {}) => {
      try {
        await connectDatabase();

        const friendship = await Friends.findOne({
          $or: [
            {
              $and: [
                { requester: new Types.ObjectId(userId1) },
                { recipient: new Types.ObjectId(userId2) },
              ],
            },
            {
              $and: [
                { requester: new Types.ObjectId(userId2) },
                { recipient: new Types.ObjectId(userId1) },
              ],
            },
          ],
        }).populate(friendshipPopulate);

        return createFriendshipResponse({
          ok: true,
          friendship,
        });
      } catch (error) {
        return createFriendshipResponse({
          ok: true,
          error: convertError(error),
        });
      }
    },
  },
  Mutation: {
    deleteFriendshipById: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { friendshipId } = input;
        // delete friendship record

        await Friends.findByIdAndDelete(friendshipId);

        // remove all instances of this from the notifications

        await SystemNotification.deleteMany({ linkId: friendshipId });

        return createFriendshipResponse({
          ok: true,
          friendship: { id: friendshipId, status: '' },
        });
      } catch (error) {
        return createFriendshipResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    acceptFriendship: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { friendshipId, notificationId } = input;
        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        existingFriendship = await updateFriendshipRequest(
          existingFriendship,
          friendshipEnum[2]
        );

        let notification;
        // update notification to read if exists
        if (notificationId) {
          notification = await SystemNotification.findOneAndUpdate(
            { _id: notificationId },
            { isRead: true },
            { new: true }
          );
        }

        // add notification
        // await addNotification(
        //   existingFriendship.requester,
        //   `${existingFriendship.recipient.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_ACCEPTED}`,
        //   notificationTypeEnum[1],
        //   existingFriendship._id
        // );

        return createFriendshipResponse({
          ok: true,
          notification: notification ? notification.transform() : null,
          friendship: existingFriendship.transform(),
        });
      } catch (error) {
        return createFriendshipResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    rejectFriendship: async (parent, { input }, {}) => {
      try {
        await connectDatabase();

        const { friendshipId, notificationId } = input;
        let existingFriendship = await Friends.findById(friendshipId).populate(
          friendshipPopulate
        );

        if (!existingFriendship)
          throw new Error(ERRORS.FRIENDSHIP.NO_FRIENDSHIP_REQUEST_EXISTS);

        existingFriendship = await updateFriendshipRequest(
          existingFriendship,
          friendshipEnum[3]
        );

        let notification;
        // update notification to read if exists
        if (notificationId) {
          notification = await SystemNotification.findOneAndUpdate(
            { _id: notificationId },
            { isRead: true },
            { new: true }
          );
        }

        // // add notification
        // await addNotification(
        //   existingFriendship.requester,
        //   `${existingFriendship.recipient.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_ACCEPTED}`,
        //   notificationTypeEnum[0],
        //   existingFriendship._id
        // );

        return createFriendshipResponse({
          ok: true,
          notification: notification ? notification.transform() : null,
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

        if (recipientId === requestorId)
          throw new Error(ERRORS.FRIENDSHIP.CANNOT_FRIEND_YOURSELF);

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

        const user = await User.findById(requestorId);
        // add notification

        const notification = await addNotification(
          recipientId,
          `${user.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_PENDING}`,
          notificationTypeEnum[0],
          friendship._id
        );
        // new SystemNotification();

        // notification.user = recipientId;
        // notification.message = `${user.username} ${MESSAGES.FRIEND_REQUEST.REQUEST_PENDING}`;
        // notification.notificationType = notificationTypeEnum[0];
        // notification.linkId = friendship._id;
        // await notification.save();

        const returnFriendship = await Friends.findById(friendship.id).populate(
          friendshipPopulate
        );

        return createFriendshipResponse({
          ok: true,
          notification: notification.transform(),
          friendship: returnFriendship.transform(),
        });
      } catch (error) {
        console.log('error', error);
        return createFriendshipResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
