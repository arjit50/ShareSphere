const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

/**
 * Connect to MongoDB database
 * Simple Mongoose connection suitable for MongoDB Atlas or local MongoDB
 */
async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || MONGODB_URI;
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Allow both const connectDB = require('./config/db') and const { connectDB } = require('./config/db')
connectDB.connectDB = connectDB;
module.exports = connectDB;
