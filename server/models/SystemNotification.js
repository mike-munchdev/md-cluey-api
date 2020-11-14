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

SystemNotificationSchema.method('transform', function () {
  const obj = this.toObject();

  obj.id = obj._id;

  return obj;
});
module.exports = mongoose.model('SystemNotification', SystemNotificationSchema);
