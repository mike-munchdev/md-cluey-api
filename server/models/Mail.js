const mongoose = require('mongoose');
const { default: validatorF } = require('validator');

const Schema = mongoose.Schema;

const MailSchema = new Schema(
  {
    mailFrom: { type: String, required: true },
    mailTo: { type: [String], required: true },
    cc: [String],
    bcc: [String],
    subject: { type: String },
    replyTo: { type: String },
    text: { type: String },
    html: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mail', MailSchema);
