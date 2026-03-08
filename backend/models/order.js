const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    sender: String, //customer email
    date: Date,
    time: String,
    items: Object,
    total: Number, //total items count
    price: Number, //total price
    orderNumber: {
        type: String,
    }

});


const orderModel = mongoose.model("orders", orderSchema);


module.exports = orderModel;