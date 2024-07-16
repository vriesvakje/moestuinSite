const mongoose = require('mongoose');
require('dotenv').config();

async function removeUsernameIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('users');
    await collection.dropIndex('username_1');
    console.log('Username index removed successfully');
  } catch (error) {
    console.error('Error removing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeUsernameIndex();