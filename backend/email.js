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

const sendQRCode = async (email, content, subject, qrCodeUrl) => {
    try {
        const response = await transporter.sendMail({
            from: '"Crunchy Bites" <nummad222@gmail.com>',
            to: email,
            subject: subject,
            text: subject,
            html: `${content}<br><br><img src="cid:qrcode" alt="QR Code" />`,
            attachments: [
                {
                    filename: "qrcode.png",
                    path: qrCodeUrl,
                    cid: "qrcode", // Content ID for embedding the image
                },
            ],
        });

        console.log("Email sent", response);
    } catch (e) {
        console.log("Error sending email:", e);
    }
};



module.exports = { sendVerificationCode, sendQRCode };