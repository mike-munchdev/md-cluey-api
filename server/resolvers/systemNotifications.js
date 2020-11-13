const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const {
  createSystemNotificationsResponse,
  createSystemNotificationResponse,
} = require('../utils/responses');

const SystemNotification = require('../models/SystemNotification');
const { notificationTypeEnum } = require('../utils/enum');
const { omit } = require('lodash');

module.exports = {
  Query: {
    getUserSystemNotifications: async (parent, { userId }, context) => {
      try {
        await connectDatabase();

        const systemNotifications = await SystemNotification.find({
          user: userId,
          isRead: false,
        });

        return createSystemNotificationsResponse({
          ok: true,
          notifications: systemNotifications
            ? systemNotifications.map((s) => s.transform())
            : [],
        });
      } catch (error) {
        return createSystemNotificationsResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
  Mutation: {
    addTestNotification: async (parent, { userId }, { isAdmin }) => {
      try {
        await connectDatabase();
        if (!isAdmin) throw new Error('Must be admin');
        const systemNotification = await SystemNotification.create({
          user: userId,
          message: 'Test Notification',
          notificationType:
            notificationTypeEnum[
              Math.floor(Math.random() * notificationTypeEnum.length)
            ],
          isRead: false,
        });

        return createSystemNotificationResponse({
          ok: true,
          notification: systemNotification.transform(),
        });
      } catch (error) {
        return createSystemNotificationResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
    updateNotification: async (parent, { input }, { isAdmin }) => {
      try {
        await connectDatabase();

        const { notificationId } = input;
        const updates = omit(input, ['_id', 'id', 'notificationId']);

        const notification = await SystemNotification.findOneAndUpdate(
          {
            _id: notificationId,
          },
          updates,
          { new: true }
        );

        return createSystemNotificationResponse({
          ok: true,
          notification: notification.transform(),
        });
      } catch (error) {
        return createSystemNotificationResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
