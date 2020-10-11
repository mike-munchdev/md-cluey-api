// https://stackoverflow.com/questions/50363220/modelling-for-friends-schema-in-mongoose
const mongoose = require('mongoose');
const { friendshipEnum } = require('../utils/enum');

const Schema = mongoose.Schema;

const friendsSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'Users' },
    recipient: { type: Schema.Types.ObjectId, ref: 'Users' },
    status: {
      type: String,
      enum: friendshipEnum,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Friends', friendsSchema);
