const nodemailer = require('nodemailer');
const sender = process.env.ADMIN_EMAIL;
const password = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: sender,
      pass: password,
    },
  });

  module.exports = { transporter };