const mongoose = require('mongoose');
const { default: validatorF } = require('validator');

const Schema = mongoose.Schema;

const companyResponseSchema = new Schema({
  company: {
    ref: 'Company',
    type: Schema.Types.ObjectId,
  },
  response: {
    type: String,
    enum: ['will-buy', 'will-buy-later', 'will-not-buy', 'will-not-buy-later'],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const UserSchema = new Schema({
  email: {
    type: String,
    validate: {
      validator: (v) => validatorF.isEmail(v),
      message: 'Email validation failed',
    },
    unique: true,
  },
  password: { type: String, required: false },
  firstName: { type: String, required: false },
  middleName: { type: String, required: false },
  lastName: { type: String, required: false },
  googleId: { type: String },
  googleAuthToken: { type: String },
  // googleAuthTokenExpiry: { type: Date },
  facebookId: { type: String },
  facebookAuthToken: { type: String },
  // facebookAuthTokenExpiry: { type: Date },
  isActive: { type: Boolean, default: false },
  confirmToken: { type: String },
  pushTokens: [String],
  responses: [companyResponseSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// TODO: encrypt password in database;
UserSchema.pre('save', async function () {
  const user = this;
  if (user.isModified('password')) {
    const { hashPassword } = require('../utils/authentication');
    user.password = await hashPassword(user.password);
  }
});

UserSchema.method('transform', function () {
  let obj = this.toObject();

  console.log('transform');
  if (obj.responses) {
    obj.responses = obj.responses.map((r) => {
      r.id = r._id;
      delete r._id;
      return r;
    });
  }
  //Rename fields
  obj.id = obj._id;
  delete obj._id;
  delete obj.password;
  return obj;
});

module.exports = mongoose.model('User', UserSchema);
