const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: "nummad222@gmail.com",
      pass: "fasu wlka uxcy jpnw",
    },
  });

  module.exports = { transporter };