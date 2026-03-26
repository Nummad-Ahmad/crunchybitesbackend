const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');

const winnerModel = require('../models/winner');
const declareWinner = require('../utils/declareWinner'); 

// Get the latest winner
router.get('/winner', async (req, res) => {
    try {
        const latestWinner = await winnerModel.findOne().sort({ date: -1 });

        if (!latestWinner) {
            return res.status(404).json({ message: "No winner has been declared yet." });
        }

        res.status(200).json({ winner: latestWinner });
    } catch (error) {
        res.status(500).json({ message: "An error occurred" });
    }
});

// Get all winners
router.get('/winners', async (req, res) => {
    try {
        const Winners = await winnerModel.find();
        res.status(200).json({ winners: Winners });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Declare winner (only runs if tomorrow is the 1st of the month)
router.get('/declareWinner', async (req, res) => {
      const cronToken = req.headers['x-cron-token']; // read secret from headers

  if (cronToken !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' }); // reject unauthorized requests
  }
    const today = moment().tz("Asia/Karachi");
    const tomorrow = today.clone().add(1, "day");

    try {
        if (tomorrow.date() === 1) {
            await declareWinner();
            console.log("Winner declared successfully!");
            return res.json({ message: "Winner declared successfully!" });
        } else {
            console.log("Not the end of the month. Winner not declared.");
            return res.json({ message: "Today is not the end of the month." });
        }
    } catch (error) {
        console.error("Error declaring winner:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
