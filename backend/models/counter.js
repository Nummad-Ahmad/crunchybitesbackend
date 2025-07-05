const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  order: {
    type: Number,
    default: 0
  }
});

const counterModel = mongoose.model('counters', counterSchema);
module.exports = counterModel;