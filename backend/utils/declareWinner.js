const moment = require("moment-timezone");
const QRCode = require("qrcode");

const orderModel = require('../models/order');
const userModel = require('../models/users');
const winnerModel = require('../models/winner');

const { sendQRCode } = require('../email');

async function declareWinner() {

    const today = moment().format("YYYY-MM-DD");

    const startDate = moment(today).startOf("month").toDate();
    const endDate = moment(today).endOf("month").toDate();

    try {

        const orders = await orderModel.find({
            date: { $gte: startDate, $lte: endDate }
        });

        if (orders.length === 0) {
            console.log("No orders found for this month.");
            return;
        }

        const totalByEmail = orders.reduce((acc, { sender, total }) => {

            acc[sender] = (acc[sender] || 0) + total;
            return acc;

        }, {});

        const highestEmail = Object.keys(totalByEmail).reduce((a, b) =>
            totalByEmail[a] > totalByEmail[b] ? a : b
        );

        const winnerUser = await userModel.findOneAndUpdate(
            { email: highestEmail },
            { $inc: { wins: 1 } },
            { new: true }
        );

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await winnerModel.create({
            email: highestEmail,
            name: winnerUser.name,
            orders: totalByEmail[highestEmail],
            verificationCode,
            isVerified: false,
            date: new Date(),
        });

        const qrData = JSON.stringify({ email: highestEmail, verificationCode });

        const qrCodeUrl = await QRCode.toDataURL(qrData);

        await sendQRCode(
            highestEmail,
            `Congrats ${winnerUser.name}. You have won this month's lucky draw.`,
            "Lucky draw won",
            qrCodeUrl
        );

    } catch (error) {
        console.log(error);
    }
}

module.exports = declareWinner;