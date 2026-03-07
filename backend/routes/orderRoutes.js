const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');

const orderModel = require('../models/order');
const counterModel = require('../models/counter');
const userModel = require('../models/users');

router.post('/order', verifyToken, async (req, res) => {

    const { date, items, price, time } = req.body;

    const email = req.user.email;

    const sum = items.samosa + items.fries + items.cheesyFries + items.roll;

    try {

        const counter = await counterModel.findOneAndUpdate(
            {},
            { $inc: { order: 1 } },
            { new: true, upsert: true }
        );

        const orderNumber = `CB-${String(counter.order).padStart(2, '0')}`;

        const updatedUser = await userModel.findOneAndUpdate(
            { email },
            { $inc: { orders: 1 } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await orderModel.create({
            sender: email,
            date,
            items,
            total: sum,
            price,
            time,
            orderNumber
        });

        res.status(201).json({
            message: "Ordered successfully",
            orderNumber
        });

    } catch (e) {

        res.status(500).json({ error: 'An error occurred while processing your request' });

    }

});

module.exports = router;