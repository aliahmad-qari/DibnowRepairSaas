// TEST NOTIFICATION SYSTEM
// Run this after server starts to test notifications

const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('./models/Notification');
const { notifyAdmin, notifyUser } = require('./services/notificationHelper');

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create admin notification
    console.log('\n📝 Test 1: Creating admin notification...');
    await notifyAdmin('Test Admin Notification', 'This is a test notification for admin', 'info');
    console.log('✅ Admin notification created');

    // Test 2: Create user notification (use a real user ID from your database)
    console.log('\n📝 Test 2: Creating user notification...');
    // Replace with actual user ID from your database
    const testUserId = '507f1f77bcf86cd799439011'; // Example ObjectId
    await notifyUser(testUserId, 'Test User Notification', 'This is a test notification for user', 'success');
    console.log('✅ User notification created');

    // Test 3: Fetch all notifications
    console.log('\n📝 Test 3: Fetching all notifications...');
    const allNotifications = await Notification.find({}).sort({ createdAt: -1 });
    console.log(`✅ Found ${allNotifications.length} notifications:`);
    allNotifications.forEach(n => {
      console.log(`  - [${n.type}] ${n.title} (userId: ${n.userId})`);
    });

    // Test 4: Fetch admin notifications
    console.log('\n📝 Test 4: Fetching admin notifications...');
    const adminNotifications = await Notification.find({ userId: 'global' });
    console.log(`✅ Found ${adminNotifications.length} admin notifications`);

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testNotifications();
