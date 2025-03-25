const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema({
    email: String,
    name: String,
    orders: Number,
    verificationCode: Number,
    isVerified: Boolean,
    date: Date,
});

const winnerModel = mongoose.model("winners", winnerSchema);
module.exports = winnerModel;
