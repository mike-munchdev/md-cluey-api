const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');
const connectDatabase = require('../models/connectDatabase');
const { companyResponsesPopulate } = require('./populate');

module.exports.decodeAppleToken = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = jwksClient({
        strictSsl: true, // Default value
        jwksUri: process.env.APPLE_RSA_KEYS_URL,
        timeout: 30000, // Defaults to 30s
      });

      const key = await client.getSigningKeyAsync(process.env.APPLE_RSA_KEY);

      const signingKey = key.getPublicKey();

      const decoded = await this.validateToken(token, signingKey);

      const { sub, email: decodedEmail } = decoded;
      resolve({ sub, decodedEmail });
    } catch (error) {
      resolve(error);
    }
  });
};
module.exports.validateToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.verify(token, secret);

      resolve(decoded);
    } catch (e) {
      reject(e);
    }
  });
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
    console.log('hashPassword error', error);
  }
};
