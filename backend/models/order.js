const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    sender: String,
    date: Date,
    time: String,
    items: Object,
    total: Number,
    price: Number,
    orderNumber: {
        type: String,
    }

});


const orderModel = mongoose.model("orders", orderSchema);


module.exports = orderModel;