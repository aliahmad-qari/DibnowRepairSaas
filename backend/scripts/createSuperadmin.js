// Script to create superadmin user
// Usage: node scripts/createSuperadmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function createSuperadmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'ali.islamic.meh2@gmail.com';
    const password = '123456A!a';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('User exists, updating role...');
      user.role = 'superadmin';
      user.password = hashedPassword;
      user.emailVerified = true;
      user.status = 'active';
    } else {
      console.log('Creating new superadmin...');
      user = new User({
        name: 'Ali SuperAdmin',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'superadmin',
        emailVerified: true,
        status: 'active'
      });
    }

    await user.save();

    console.log('\n✅ Superadmin created/updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: superadmin`);

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperadmin();
