const mongoose = require('mongoose');
const { default: validatorF } = require('validator');
const { transformCompany } = require('../utils/transform');

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
    enum: ['male', 'female', 'other'],
  },
  googleId: { type: String },
  googleAuthToken: { type: String },

  facebookId: { type: String },
  facebookAuthToken: { type: String },

  isActive: { type: Boolean, default: false },
  confirmToken: { type: String },
  friends: [String],
  companyResponses: [companyResponseSchema],
  isProfilePublic: { type: Boolean, default: false },
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

  if (this.companyResponses) {
    obj.companyResponses = this.companyResponses.map((r) => {
      return r.transform();
    });
  }
  //Rename fields
  obj.id = obj._id;
  delete obj._id;
  delete obj.password;

  return obj;
});

companyResponseSchema.method('transform', function () {
  let obj = this.toObject();

  const company = transformCompany(obj.company);
  obj.company = company;
  // obj.company.id = obj.company._id;
  obj.companyId = obj.company._id;

  //Rename fields
  obj.id = obj._id;
  delete obj._id;

  return obj;
});

module.exports = mongoose.model('User', UserSchema);
