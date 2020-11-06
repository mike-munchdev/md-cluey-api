const escapeStringRegexp = require('escape-string-regexp');
const { comparePassword } = require('../utils/authentication');
const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');
const { generateToken } = require('../utils/authentication');
const connectDatabase = require('../models/connectDatabase');
const { createSystemNotificationsResponse } = require('../utils/responses');

const SystemNotification = require('../models/SystemNotification');

module.exports = {
  Query: {
    getUserSystemNotifications: async (parent, { userId }, context) => {
      try {
        await connectDatabase();
        console.log('getUserSystemNotifications', userId);
        const systemNotifications = await SystemNotification.find({
          user: userId,
        });

        console.log('systemNotifications', systemNotifications);
        return createSystemNotificationsResponse({
          ok: true,
          systemNotifications: systemNotifications
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
};
