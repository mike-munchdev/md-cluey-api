const { ERRORS } = require('../constants/errors');
const { convertError } = require('../utils/errors');

const connectDatabase = require('../models/connectDatabase');
const { createGeneralResponse } = require('../utils/responses');
const { sendMail } = require('../utils/mail');
const { RESPONSES } = require('../constants/responses');

module.exports = {
  Mutation: {
    sendMail: async (parent, { input }, { isAdmin }) => {
      try {
        if (!isAdmin) throw new Error(ERRORS.AUTH.DENIED);

        await sendMail({
          mailFrom: input.from,
          mailTo: input.to,
          subject: 'Test Email',
          html: RESPONSES.EMAIL.SIGN_UP_EMAIL.body.replace(
            '{CONFIRM_CODE}',
            `abcdefg`
          ),
        });
        return createGeneralResponse({
          ok: true,
          message: 'Completed',
        });
      } catch (error) {
        return createGeneralResponse({
          ok: false,
          error: convertError(error),
        });
      }
    },
  },
};
