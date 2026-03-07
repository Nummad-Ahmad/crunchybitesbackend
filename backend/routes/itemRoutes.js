const express = require('express');
const router = express.Router();

const itemModel = require('../models/items');

router.get('/itemdata', async (req, res) => {

    try {

        const itemData = await itemModel.find();

        res.status(200).json({ data: itemData });

    } catch (e) {

        res.status(500).json({ message: "An error occurred" });

    }

});

module.exports = router;