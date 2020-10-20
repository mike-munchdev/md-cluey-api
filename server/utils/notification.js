const SystemNotification = require('../models/SystemNotification');

module.exports.addNotification = (user, message, notificationType, linkId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // add notification
      const notification = new SystemNotification();

      notification.user = user;
      notification.message = message;
      notification.notificationType = notificationType;
      notification.linkId = linkId;

      await notification.save();
      resolve(notification);
    } catch (error) {
      reject(error);
    }
  });
};
