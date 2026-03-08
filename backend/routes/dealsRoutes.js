const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const dealModel = require('../models/deals');

router.get('/deals', verifyToken, async (req, res) => {
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
    try {
        const { dealName, items, price, status, enableAt,
            expiryAt } = req.body;
s
        const newDeal = await dealModel.create({
            dealName, items, price, status, enableAt,
            expiryAt
        });

        res.status(201).json({
            message: "Deal added successfully",
        });

    } catch (e) {
        console.log("An error occurred", e);
    }
})

router.patch('/deals/toggleStatus', verifyToken, async (req, res) => {
    try {
        const { dealName } = req.body;

        const result = await dealModel.updateMany(
            { dealName },
            [{ $set: { status: { $not: "$status" } } }] 
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Deal not found" });
        }

        res.status(201).json({
            message: `Deal status updated for ${result.modifiedCount} deal(s)`
        });

    } catch (e) {
        console.log("An error occurred", e);
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