const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const orderModel = require('../models/order');
const moment = require("moment-timezone");

router.get('/data', verifyToken, async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const startDate = moment(date, "YYYY-MM-DD").startOf("month").toDate();
    const endDate = moment(date, "YYYY-MM-DD").endOf("month").toDate();

    try {
        const data = await orderModel.find({
            sender: req.user.email,
            date: { $gte: startDate, $lte: endDate }
        });

        res.status(200).json({ data });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "An error occurred" });
    }
});

module.exports = router;