const express = require('express');
const router = express.Router();
const adminEmail = process.env.ADMIN_EMAIL;

const verifyToken = require('../middleware/verifyToken');
const dealModel = require('../models/deals');
const orderModel = require('../models/order');
const userModel = require('../models/users');
const counterModel = require('../models/counter');

router.get('/deals', async (req, res) => {
    try {

        const { isAdmin } = req.query;

        let dealsData;

        if (isAdmin === "true") {
            dealsData = await dealModel.find();
        } else {
            dealsData = await dealModel.find({ status: true });
        }
        res.status(200).json({ data: dealsData });

    } catch (e) {
        console.log("An error occurred", e);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/deals/create', verifyToken, async (req, res) => {

    // 🔒 Admin check
    if (req.user.email !== adminEmail) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const {
            dealName,
            description,
            image,
            items,
            originalPrice,
            dealPrice,
            enableAt,
            expiryAt,
            status // optional
        } = req.body;

        // ✅ Basic validation
        if (!dealName || !dealPrice) {
            return res.status(400).json({
                error: "dealName and dealPrice are required"
            });
        }

        // ✅ Check duplicate (since unique: true)
        const existingDeal = await dealModel.findOne({ dealName });
        if (existingDeal) {
            return res.status(400).json({
                error: "Deal with this name already exists"
            });
        }

        // ✅ Create deal
        const newDeal = await dealModel.create({
            dealName,
            description,
            image,
            items,
            originalPrice,
            dealPrice,
            enableAt,
            expiryAt,
            status: status ?? true // default true if not provided
        });

        res.status(201).json({
            message: "Deal added successfully",
            data: newDeal
        });

    } catch (e) {
        console.log("Error creating deal:", e);

        // Handle Mongo duplicate key error
        if (e.code === 11000) {
            return res.status(400).json({
                error: "Deal name must be unique"
            });
        }

        res.status(500).json({ message: "Server error" });
    }
});

router.patch('/deals/toggleStatus', verifyToken, async (req, res) => {

    if (req.user.email !== adminEmail) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const { dealName } = req.body;

        const updatedDeal = await dealModel.findOneAndUpdate(
            { dealName },
            [
                {
                    $set: {
                        status: { $not: "$status" }
                    }
                }
            ],
            { new: true }
        );

        if (!updatedDeal) {
            return res.status(404).json({ message: "Deal not found" });
        }

        res.status(200).json({
            message: "Deal status updated successfully",
            data: updatedDeal
        });

    } catch (e) {
        console.log("An error occurred", e);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/order-deal', verifyToken, async (req, res) => {
    try {
        const { dealName, items } = req.body;
        const email = req.user.email;

        const dealNames = Array.isArray(dealName) ? dealName : [dealName];

        const deals = await dealModel.find({
            dealName: { $in: dealNames },
            status: true
        });

        if (!deals.length) {
            return res.status(404).json({ message: "No valid deals found" });
        }

        let finalItems = {};

        if (items && typeof items === "object") {
            finalItems = items;
        } else {
            dealNames.forEach(name => {
                const deal = deals.find(d => d.dealName === name);

                deal.items.forEach(item => {
                    finalItems[item.name] =
                        (finalItems[item.name] || 0) + item.quantity;
                });
            });
        }

        const totalItems = Object.values(finalItems)
            .reduce((sum, qty) => sum + qty, 0);

        let totalPrice = 0;

        dealNames.forEach(name => {
            const deal = deals.find(d => d.dealName === name);
            totalPrice += deal.dealPrice;
        });

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
            return res.status(404).json({ error: "User not found" });
        }

        const newOrder = await orderModel.create({
            sender: email,
            date: new Date(),
            time: new Date().toLocaleTimeString(),
            items: finalItems, // ✅ OBJECT
            total: totalItems,
            price: totalPrice,
            orderNumber,
            deals: dealNames // optional (for tracking)
        });

        res.status(201).json({
            message: "Deals ordered successfully",
            orderNumber,
            order: newOrder
        });

    } catch (e) {
        console.log("Error in order-deal:", e);
        res.status(500).json({ message: "Server error" });
    }
});

router.patch('/deals/autoExpiry', async (req, res) => {
    try {
        let today = new Date();
        today = new Date(today.getTime() + 5 * 60 * 60 * 1000);

        const result = await dealModel.updateMany(
            {
                expiryAt: { $lte: today },
                status: true
            },
            { $set: { status: false } }
        );
        res.status(200).json({
            message: "Auto expiry executed",
            expiredDeals: result.modifiedCount
        });
    } catch (e) {
        console.log("An error occurred", e);
        res.status(500).json({ message: "Server error" });
    }
});

router.patch('/deals/autoEnable', async (req, res) => {
    try {
        let today = new Date();
        today = new Date(today.getTime() + 5 * 60 * 60 * 1000);

        const result = await dealModel.updateMany(
            {
                enableAt: { $lte: today },
                status: false
            },
            { $set: { status: true } }
        );
        res.status(200).json({
            message: "Auto enable executed",
            enabledDeals: result.modifiedCount
        });
    } catch (e) {
        console.log("An error occurred", e);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;