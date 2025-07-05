const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  order: {
    type: Number,
    default: 0
  }
});

const counterModel = mongoose.model('counter', counterSchema);
module.exports = counterModel;