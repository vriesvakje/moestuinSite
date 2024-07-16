const mongoose = require('mongoose');

const VegetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  selected: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Vegetable', VegetableSchema);