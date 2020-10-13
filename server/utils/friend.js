const { MESSAGES } = require('../constants/messages');
const SystemNotification = require('../models/SystemNotification');
const { notificationTypeEnum } = require('./enum');

module.exports.updateFriendshipRequest = (friendship, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      friendship.status = status;

      await friendship.save();

      resolve(friendship);
    } catch (error) {
      reject(error);
    }
  });
};
