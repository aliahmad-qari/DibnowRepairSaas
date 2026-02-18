// Script to fix users with invalid planId (string instead of ObjectId)
// Usage: node scripts/fixInvalidPlanId.js

const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 first for DNS resolution
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Plan = require('../models/Plan');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ali-islamic:xlUR8DWnt7jpcw2M@cluster0.0nsjvku.mongodb.net/Dibnow?retryWrites=true&w=majority';

async function fixInvalidPlanIds() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB Successfully');

    // First, use raw MongoDB to find users with string planId (bypassing Mongoose validation)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find users where planId is a string (invalid ObjectId)
    const usersWithStringPlanId = await usersCollection.find({
      planId: { $type: 'string' }
    }).toArray();
    
    console.log(`\nFound ${usersWithStringPlanId.length} users with string planId (invalid)`);
    
    for (const user of usersWithStringPlanId) {
      console.log(`\nUser ${user.email} has invalid string planId: "${user.planId}"`);
      
      // Try to find a plan with matching name
      const planName = user.planId.toLowerCase();
      const matchingPlan = await Plan.findOne({ 
        $or: [
          { name: { $regex: new RegExp(`^${planName}$`, 'i') } },
          { slug: planName }
        ]
      });

      if (matchingPlan) {
        console.log(`  Found matching plan: ${matchingPlan.name} (${matchingPlan._id})`);
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { planId: matchingPlan._id } }
        );
      } else {
        console.log(`  No matching plan found, setting planId to null`);
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { planId: null } }
        );
      }
      
      console.log(`  ✅ Fixed user ${user.email}`);
    }

    // Also check for users with undefined planId that should be null
    const usersWithUndefinedPlanId = await usersCollection.find({
      planId: { $exists: true, $type: 'undefined' }
    }).toArray();
    
    console.log(`\nFound ${usersWithUndefinedPlanId.length} users with undefined planId`);
    
    for (const user of usersWithUndefinedPlanId) {
      console.log(`\nUser ${user.email} has undefined planId, setting to null`);
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { planId: null } }
      );
      console.log(`  ✅ Fixed user ${user.email}`);
    }

    // List all users and their planId status
    console.log('\n\n=== All Users Summary ===');
    const allUsers = await usersCollection.find({}).project({ email: 1, planId: 1, role: 1 }).toArray();
    for (const user of allUsers) {
      console.log(`  ${user.email} (${user.role}): planId = ${user.planId} (type: ${typeof user.planId})`);
    }

    const totalFixed = usersWithStringPlanId.length + usersWithUndefinedPlanId.length;
    console.log(`\n\n✅ Fixed ${totalFixed} users with invalid planId values`);
    
    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixInvalidPlanIds();
