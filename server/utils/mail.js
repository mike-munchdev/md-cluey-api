const nodemailer = require('nodemailer');

module.exports.sendMail = (mail) => {
  return new Promise(async (resolve, reject) => {
    try {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: process.env.SENDINBLUE_HOST,
        port: parseInt(process.env.SENDINBLUE_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SENDINBLUE_USER,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });

      const message = {
        from: mail.mailFrom,
        to: mail.mailTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        cc: mail.cc,
        bcc: mail.bcc,
      };

      await transporter.sendMail(message);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
