// Script to create superadmin user
// Usage: node scripts/createSuperadmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// Force IPv4 first for DNS resolution - Fixes SRV ETIMEOUT in Node 18+
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ali-islamic:xlUR8DWnt7jpcw2M@cluster0.0nsjvku.mongodb.net/Dibnow?retryWrites=true&w=majority';

async function createSuperadmin() {
  try {
    console.log(`Connecting to: ${MONGODB_URI.substring(0, 20)}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Wait 30 seconds for server selection
      connectTimeoutMS: 30000,         // Wait 30 seconds for initial connection
    });
    console.log('Connected to MongoDB Successfully');

    const email = 'ali.islamic.meh4@gmail.com';
    const password = '123456A!a';

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log('User exists, updating role and resetting password...');
      user.role = 'superadmin'.toLowerCase();
      user.status = 'active';
      user.emailVerified = true;
      user.password = password; // Let model's pre-save hook hash this
    } else {
      console.log('Creating new superadmin...');
      user = new User({
        name: 'Ali SuperAdmin',
        email: email.toLowerCase(),
        password: password, // Let model's pre-save hook hash this
        role: 'superadmin',
        emailVerified: true,
        status: 'active'
      });
    }

    await user.save();

    console.log('\n✅ Superadmin status synchronized successfully!');
    console.log(`Email: ${email}`);
    console.log(`Role: superadmin`);
    console.log('\nLogin with this email and navigate to the "Root" tab.');

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperadmin();
