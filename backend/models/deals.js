const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    sender: String, //customer email
    dealName: { type: String, required: true, unique: true },
    items: Array,
    price: Number, //total price
    status: {
        type: Boolean,
        default: true
    },
    enableAt: Date,
    expiryAt: Date,

}, { timestamps: true });

const dealModel = mongoose.model("deals", dealSchema);

module.exports = dealModel;