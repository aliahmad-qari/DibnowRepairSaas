// Script to seed subscription plans into the database
// Usage: node scripts/seedPlans.js

const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 first for DNS resolution - Fixes SRV ETIMEOUT in Node 18+
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Plan = require('../models/Plan');

const MONGODB_URI = process.env.MONGODB_URI;

const DEFAULT_PLANS = [
  {
    name: 'FREE TRIAL',
    description: 'Perfect for exploring the platform features before committing.',
    price: 0,
    currency: 'GBP',
    duration: 30,
    features: ['1 Repair Customer', '1 In Stock', '1 Category', '1 Brand', '1 Teams'],
    limits: { repairsPerMonth: 1, teamMembers: 1, inventoryItems: 1, categories: 1, brands: 1, aiDiagnostics: false },
    isActive: true
  },
  {
    name: 'BASIC',
    description: 'Essential features for small repair shops starting their digital journey.',
    price: 2,
    currency: 'GBP',
    duration: 30,
    features: ['5 Repair Customer', '5 In Stock', '5 Category', '5 Brand', '5 Teams'],
    limits: { repairsPerMonth: 5, teamMembers: 5, inventoryItems: 5, categories: 5, brands: 5, aiDiagnostics: true },
    isActive: true
  },
  {
    name: 'PREMIUM',
    description: 'Advanced capabilities for growing businesses with multiple staff members.',
    price: 5,
    currency: 'GBP',
    duration: 30,
    features: ['7 Repair Customer', '7 In Stock', '7 Category', '7 Brand', '7 Teams'],
    limits: { repairsPerMonth: 7, teamMembers: 7, inventoryItems: 7, categories: 7, brands: 7, aiDiagnostics: true },
    isActive: true
  },
  {
    name: 'GOLD',
    description: 'Enterprise-grade infrastructure for high-volume service centers.',
    price: 7,
    currency: 'GBP',
    duration: 30,
    features: ['1000 Repair Customer', '1000 In Stock', '100 Category', '50 Brand', '50 Teams'],
    limits: { repairsPerMonth: 1000, teamMembers: 50, inventoryItems: 1000, categories: 100, brands: 50, aiDiagnostics: true },
    isActive: true
  }
];

async function seedPlans() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Clearing existing plans (to avoid duplicates)...');
    await Plan.deleteMany({});

    console.log('Seeding plans...');
    const createdPlans = await Plan.insertMany(DEFAULT_PLANS);
    
    console.log('\n✅ Successfully seeded the following plans:');
    createdPlans.forEach(p => {
      console.log(`- ${p.name} (ID: ${p._id}, Price: ${p.price} ${p.currency})`);
    });

    console.log('\n\n🚀 DATABASE SEEDED SUCCESSFULLY');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedPlans();
