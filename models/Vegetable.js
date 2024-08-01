const mongoose = require('mongoose');

const VegetableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  selected: { type: Boolean, default: false }
});

const Vegetable = mongoose.model('Vegetable', VegetableSchema);

module.exports = Vegetable;
