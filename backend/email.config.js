const nodemailer = require('nodemailer');
const sender = process.env.ADMIN_EMAIL;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const hostPort = process.env.HOST_PORT;

const transporter = nodemailer.createTransport({
    host: host,
    port: hostPort,
    secure: false, 
    auth: {
      user: sender,
      pass: password,
    },
  });

  module.exports = { transporter };