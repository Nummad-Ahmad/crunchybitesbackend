const { transporter } = require("./email.config");

const sendVerificationCode = async (email, content, subject) => {
    try {
        const response = await transporter.sendMail({
            from: '"Crunchy Bites" <nummad222@gmail.com>',
            to: email,
            subject: subject,
            text: subject,
            html: content,
        });
        console.log('Email sent', response);
    } catch (e) {
        console.log(e);
    }
}

const sendFeedback = async (email, message, name) => {
    try {
        const response = await transporter.sendMail({
            from: '"Crunchy Bites" <nummad222@gmail.com>', 
            to: "nummad222@gmail.com",
            subject: 'User feedback',
            text: "User feedback",
            html: `From: ${email}<br> ${message}`,
        });
        console.log('Email sent', response);
    } catch (e) {
        console.log(e);
    }
}


module.exports = { sendVerificationCode, sendFeedback };