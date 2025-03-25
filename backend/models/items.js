const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name : String,
    price: Number,
});

const itemModel = mongoose.model("items", itemSchema);

module.exports = itemModel;