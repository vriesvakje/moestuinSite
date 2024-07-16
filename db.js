const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/moestuinverhuur');
    console.log('MongoDB verbinding succesvol');
  } catch (err) {
    console.error('MongoDB verbindingsfout:', err);
    process.exit(1);
  }
};

module.exports = connectDB;