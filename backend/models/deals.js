const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    image: String,
    description: String,
    dealName: { type: String, required: true, unique: true },
    items: Array,
    originalPrice: Number,
    dealPrice: Number,
    status: {
        type: Boolean,
        default: true
    },
    enableAt: Date,
    expiryAt: Date,
}, { timestamps: true });

const dealModel = mongoose.model("deals", dealSchema);

module.exports = dealModel;