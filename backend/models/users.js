const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : String,
    email: String,
    password: String,
    wins: Number,
    orders: Number,
    isVerified: Boolean,
    verificationCode: String,
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;