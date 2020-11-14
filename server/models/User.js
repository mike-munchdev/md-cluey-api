const mongoose = require('mongoose');
const { default: validatorF } = require('validator');
const { genderEnum } = require('../utils/enum');
const { transformCompany } = require('../utils/transform');

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      validate: {
        validator: (v) => validatorF.isEmail(v),
        message: 'Email validation failed',
      },
      unique: true,
    },
    username: {
      type: String,
    },
    password: { type: String, required: false },
    firstName: { type: String, required: false },
    middleName: { type: String, required: false },
    lastName: { type: String, required: false },
    dob: { type: Date },
    city: { type: String },
    state: { type: String },
    gender: {
      type: String,
      enum: genderEnum,
    },
    googleId: { type: String },
    googleAuthToken: { type: String },
    appleId: { type: String },
    appleAuthToken: { type: String },
    appleIdentityToken: { type: String },
    facebookId: { type: String },
    facebookAuthToken: { type: String },
    isActive: { type: Boolean, default: false },
    confirmToken: { type: String },
    isProfilePublic: { type: Boolean, default: false },
    mustResetPassword: { type: Boolean, default: false },
    isAccountLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

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

  //Rename fields
  obj.id = obj._id;
  delete obj._id;
  delete obj.password;

  return obj;
});

module.exports = mongoose.model('User', UserSchema);
