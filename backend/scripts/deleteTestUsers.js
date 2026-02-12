// Script to delete test users - Run this to clean up database
// Usage: node scripts/deleteTestUsers.js

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function deleteTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete the test emails
    const result = await User.deleteMany({
      email: {
        $in: [
          'ali.islamic.meh1@gmail.com',
          'ali.islamic.meh@gmail.com',
          'ali@gmail.com'
        ]
      }
    });

    console.log(`Deleted ${result.deletedCount} users`);

    // Also verify deletion
    const remaining = await User.find({
      email: {
        $in: [
          'ali.islamic.meh1@gmail.com',
          'ali.islamic.meh@gmail.com',
          'ali@gmail.com'
        ]
      }
    });
    console.log(`Remaining users with these emails: ${remaining.length}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestUsers();
