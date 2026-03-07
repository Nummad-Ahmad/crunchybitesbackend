const express = require('express');
const router = express.Router();
const adminEmail = process.env.ADMIN_EMAIL;

const verifyToken = require('../middleware/verifyToken');

const userModel = require('../models/users');
const orderModel = require('../models/order');
const itemModel = require('../models/items');
const winnerModel = require('../models/winner');

router.get('/customerdata', verifyToken, async (req, res) => {

    try {

        const data = await userModel.find().select('-password -verificationCode');

        res.status(200).json({ data });

    } catch (e) {

        res.status(500).json({ message: "An error occurred" });

    }

});

router.get('/showorders', verifyToken, async (req, res) => {

    try {

        const today = new Date();

        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const orderData = await orderModel.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.status(200).json({ data: orderData });

    } catch (e) {

        res.status(500).json({ error: 'An error occurred while fetching today’s orders.' });

    }

});

router.post('/updateitem', verifyToken, async (req, res) => {

    const { name, price } = req.body;

    if (req.user.email !== adminEmail) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {

        await itemModel.findOneAndUpdate(
            { name },
            { price },
            { new: true }
        );

        res.status(200).json({ message: "Updated successfully" });

    } catch (e) {

        res.status(500).json({ message: "An error occurred" });

    }

});

router.post('/updatewinner', verifyToken, async (req, res) => {

    const { verificationCode, winnerEmail } = req.body;

    const email = req.user.email;

    if (email !== adminEmail) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {

        const existingWinner = await winnerModel.findOne({
            email: winnerEmail,
            verificationCode
        });

        if (!existingWinner) {
            return res.status(400).json({ error: "Verification failed. Please try again." });
        }

        if (existingWinner.isVerified) {
            return res.status(400).json({ error: "Reward already claimed." });
        }

        await winnerModel.findOneAndUpdate(
            { email: winnerEmail, verificationCode },
            { $set: { isVerified: true } },
            { new: true }
        );

        res.status(200).json({ message: "Winner verified successfully!" });

    } catch (error) {

        res.status(500).json({ error: "An error occurred while processing your request." });

    }
    
});

module.exports = router;    