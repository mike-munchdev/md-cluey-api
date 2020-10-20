// https://stackoverflow.com/questions/50363220/modelling-for-friends-schema-in-mongoose
const mongoose = require('mongoose');
const { friendshipEnum } = require('../utils/enum');

const Schema = mongoose.Schema;

const FriendsSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: friendshipEnum,
    },
  },
  { timestamps: true }
);

FriendsSchema.method('transform', function () {
  let obj = this.toObject();

  if (obj.recipient) {
    obj.recipient.id = obj.recipient._id;
  }
  if (obj.requester) {
    obj.requester.id = obj.requester._id;
  }

  obj.id = obj._id;

  return obj;
});

module.exports = mongoose.model('Friends', FriendsSchema);
