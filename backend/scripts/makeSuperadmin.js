// Script to create/update superadmin from existing user
// Usage: node scripts/makeSuperadmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function makeSuperadmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const email = 'ali3@gmail.com';
    const password = '123456'; // Default password if user doesn't exist

    // Find existing user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('Found existing user:', user.email);
      console.log('Current role:', user.role);
      
      // Update to superadmin
      user.role = 'superadmin';
      user.status = 'active';
      user.emailVerified = true;
      await user.save();
      
      console.log('\n✅ User upgraded to SUPERADMIN!');
    } else {
      console.log('User not found. Creating new superadmin...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      user = new User({
        name: 'Ali SuperAdmin',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'superadmin',
        emailVerified: true,
        status: 'active'
      });
      
      await user.save();
      console.log('\n✅ Superadmin created!');
    }

    console.log(`\nEmail: ${email}`);
    console.log('Role: superadmin');
    console.log('\nNow login with this email and select "Root" tab!');

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeSuperadmin();
