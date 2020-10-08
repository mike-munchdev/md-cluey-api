const User = require('../models/User');

module.exports.isUserNameUnique = async (id, username) => {
  const user = await User.findOne({ _id: { $ne: id }, username });

  return user ? false : true;
};
