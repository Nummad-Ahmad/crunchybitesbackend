const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const moment = require("moment-timezone");

const orderModel = require('../models/order');
const counterModel = require('../models/counter');
const userModel = require('../models/users');
const itemModel = require("../models/items");

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

router.delete('/deleteOrders', async (req, res) => {
    try {

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const result = await orderModel.deleteMany({
            date: { $lt: twoMonthsAgo }
        });

        res.json({
            message: "Old orders deleted successfully",
            deletedCount: result.deletedCount
        });

    } catch (e) {
        console.log('error while deleting orders', e);
        res.status(500).json({ error: "Failed to delete orders" });
    }
});


router.post('/discount', async (req, res) => {
    const today = moment().tz("Asia/Karachi").date();

    const discountMap = {
        9: { name: 'fries', price: 70 },
        18: { name: 'cheesyFries', price: 160 },
        27: { name: 'chocoMilk', price: 160 }
    };

    const discount = discountMap[today];

    try {
        if (!discount) {
            return res.status(200).json({
                message: "ℹ️ No discounts scheduled for today"
            });
        }

        const updatedItem = await itemModel.findOneAndUpdate(
            { name: discount.name },
            { price: discount.price },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: `❌ Item '${discount.name}' not found`
            });
        }

        return res.status(200).json({
            message: `✅ ${discount.name} price updated to ${discount.price}`
        });

    } catch (e) {
        console.error("Item update error:", e);
        return res.status(500).json({
            message: "❌ Server error. Try again later."
        });
    }
});


router.post('/reset', async (req, res) => {
    const yesterday = moment().tz("Asia/Karachi").subtract(1, 'day').date();

    const discountMap = {
        9: { name: 'fries', price: 70 },
        18: { name: 'cheesyFries', price: 160 },
        27: { name: 'chocoMilk', price: 160 }
    };

    const originalPrices = {
        fries: 100,
        cheesyFries: 200,
        chocoMilk: 200
    };

    const yesterdayDiscount = discountMap[yesterday];

    try {
        if (!yesterdayDiscount) {
            return res.status(200).json({
                message: "ℹ️ No discounts were scheduled yesterday"
            });
        }

        const itemToReset = yesterdayDiscount.name;

        const resetItem = await itemModel.findOneAndUpdate(
            { name: itemToReset },
            { price: originalPrices[itemToReset] },
            { new: true }
        );

        if (!resetItem) {
            return res.status(404).json({
                message: `❌ Item '${itemToReset}' not found`
            });
        }

        return res.status(200).json({
            message: `🔁 '${itemToReset}' reset to ${originalPrices[itemToReset]}`
        });

    } catch (error) {
        console.error("Reset error:", error);
        return res.status(500).json({
            message: "❌ Server error while resetting price"
        });
    }
});

module.exports = router;