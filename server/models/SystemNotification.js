// https://stackoverflow.com/questions/50363220/modelling-for-friends-schema-in-mongoose
const mongoose = require('mongoose');
const { notificationTypeEnum } = require('../utils/enum');

const Schema = mongoose.Schema;

const SystemNotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'Users' },
    message: { type: String, required: true },
    notificationType: { type: String, enum: notificationTypeEnum },
    linkId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = mongoose.model('SystemNotification', SystemNotificationSchema);
