/**
 * Create Superadmin Script
 * Run this script to create a superadmin account in MongoDB
 * 
 * Usage: node scripts/createSuperadmin.js
 * 
 * Default credentials:
 * Email: admin@dibnow.com
 * Password: admin123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration - Change these values
const SUPERADMIN_CONFIG = {
  name: 'Super Admin',
  email: 'ali.islamic.meh@gamil.com',
  password: 'admin123!A',
  phone: '+1234567890'
};

async function createSuperadmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dibnow');
    console.log('✅ Connected to MongoDB');

    // Load User model
    const User = require('../models/User');

    // Check if superadmin already exists
    const existingUser = await User.findOne({ role: 'superadmin' });
    if (existingUser) {
      console.log('⚠️  Superadmin already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser._id}`);
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(SUPERADMIN_CONFIG.password, salt);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('✅ Password updated successfully!');
      
      await mongoose.connection.close();
      return;
    }

    // Generate password hash
    console.log('🔐 Generating password hash...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SUPERADMIN_CONFIG.password, salt);
    console.log('✅ Password hash generated');

    // Create superadmin user
    const superadmin = new User({
      name: SUPERADMIN_CONFIG.name,
      email: SUPERADMIN_CONFIG.email,
      password: hashedPassword,
      phone: SUPERADMIN_CONFIG.phone,
      role: 'superadmin',
      emailVerified: true,
      status: 'active',
      permissions: ['all']
    });

    await superadmin.save();
    console.log('✅ Superadmin created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${SUPERADMIN_CONFIG.email}`);
    console.log(`   Password: ${SUPERADMIN_CONFIG.password}`);
    console.log('');
    console.log('🌐 Access Admin Panel:');
    console.log('   http://localhost:3000/#/login');

    await mongoose.connection.close();
    console.log('');
    console.log('🔒 Connection closed');

  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    process.exit(1);
  }
}

// Run the script
createSuperadmin();
