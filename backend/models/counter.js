const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  orders: { type: String, default: 'CB-00' }
});

const counterModel = mongoose.model('counter', counterSchema);
module.exports = counterModel;
