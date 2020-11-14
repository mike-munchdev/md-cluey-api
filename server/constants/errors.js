module.exports.ERRORS = {
  USER: {
    NOT_FOUND_WITH_PROVIDED_INFO:
      'No user found with the provided information.',
    NOT_FOUND: 'No user found.',
    EMAIL_AND_PASSWORD_INCORRECT:
      'Email and password combination is incorrect.',
    EMAIL_AND_PASSWORD_INCORRECT_FAILED_ATTEMPTS:
      'Email and password combination is incorrect. You have <REMAINING_ATTEMPTS> attempts remaining.',
    ACCOUNT_EMAIL_TAKEN: 'Email address already associated with an account.',
    ACCOUNT_FACEBOOK_TAKEN:
      'Facebook account already associated with an account.',
    ACCOUNT_FACEBOOK_FAILED: 'Facebook account login failed.',
    ACCOUNT_GOOGLE_TAKEN: 'Google account already associated with an account.',
    ACCOUNT_GOOGLE_FAILED: 'Google account login failed.',
    ACCOUNT_NOT_ACTIVATED: 'Your account is not active.',
    ACCOUNT_LOCKED: 'Your account is locked.',
    PUSH_TOKEN_ALREADY_EXISTS: 'Push token already exists.',
    CONFIRM_TOKEN_NOT_FOUND: 'Confirm token not found.',
    USERNAME_ALREADY_TAKEN: 'The username you have selected is already taken.',
  },
  FRIENDSHIP: {
    EXISTING_FRIENDSHIP_REQUEST:
      'Friendship or friendship request already exists.',
    NO_FRIENDSHIP_REQUEST_EXISTS:
      'Friendship or friendship request does not exist.',
    CANNOT_FRIEND_YOURSELF: 'You cannot befriend yourself.',
  },
  AUTH: {
    DENIED: 'Access denied',
  },
  PRODUCT: {
    SEARCH_TEXT_LENGTH_TOO_SHORT:
      'The search text must be at least 3 characters long',
  },
  COMPANY: {
    NOT_FOUND_WITH_PROVIDED_INFO:
      'No company found with the provided information.',
  },
  COMPANY_RESPONSE: {
    NO_RESPONSES_FOUND: 'No company responses found.',
    NO_RESPONSE_FOUND: 'No company response found.',
    INVALID_DATA: 'Invalid data received',
  },
};
