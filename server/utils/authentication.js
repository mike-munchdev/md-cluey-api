const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');
const connectDatabase = require('../models/connectDatabase');
const { companyResponsesPopulate } = require('./populate');
const { default: Bugsnag } = require('@bugsnag/js');

const client = jwksClient({
  jwksUri: process.env.APPLE_RSA_KEYS_URL,
});
module.exports.getAppleSigningKey = async (kid) => {
  const key = await client.getSigningKeyAsync(process.env.APPLE_RSA_KEY);
  const signingKey = key.getPublicKey();
  return signingKey;
};
module.exports.decodeAppleToken = async (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });

    const kid = decoded.header.kid;
    const appleKey = await this.getAppleSigningKey(kid);

    if (!appleKey) throw new Error('No Apple Key');
    const verfied = await this.validateToken(token, appleKey);

    const { sub, email: decodedEmail } = verfied;
    return { sub, decodedEmail };
  } catch (error) {
    Bugsnag.notify(error);
    throw error;
  }
};
module.exports.validateToken = async (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret, { ignoreExpiration: true });

    return decoded;
  } catch (e) {
    Bugsnag.notify(e);
    throw e;
  }
};

module.exports.findUserByToken = (decoded) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (decoded.info.id) {
        await connectDatabase();
        const user = await User.findById(decoded.info.id).populate(
          companyResponsesPopulate
        );

        resolve(user);
      } else {
        throw new Error('Malformed token');
      }
    } catch (e) {
      Bugsnag.notify(e);
      reject(e);
    }
  });
};

module.exports.generateToken = ({ user, type }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + 30);
      const token = jwt.sign(
        {
          info: user,
          type,
          exp: parseInt((expirationDate.getTime() / 1000).toString(), 10),
        },
        process.env.JWT_SECRET
      );

      resolve(token);
    } catch (e) {
      Bugsnag.notify(e);
      reject(e);
    }
  });
};

module.exports.comparePassword = ({ password, candidatePassword }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!password) {
        throw new Error('Password not set.');
      }

      const isMatch = await bcrypt.compare(candidatePassword, password);

      resolve(isMatch);
    } catch (error) {
      Bugsnag.notify(error);
      reject(error);
    }
  });
};

module.exports.hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    Bugsnag.notify(error);
  }
};
