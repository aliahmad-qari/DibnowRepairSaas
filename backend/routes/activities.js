const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticateToken } = require('../middleware/auth');

// Get all activity logs for owner
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await Activity.find({ ownerId: req.user.userId }).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new activity log
router.post('/', authenticateToken, async (req, res) => {
  try {
    const log = new Activity({
      ...req.body,
      userId: req.user.userId,
      ownerId: req.user.userId
    });
    const newLog = await log.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to log activity (can be called from other routes)
const logActivity = async (ownerId, actionType, moduleName, refId = null, status = 'Success', userName = 'System') => {
  try {
    const activity = new Activity({
      ownerId,
      userId: ownerId,
      userName: userName,
      actionType,
      moduleName,
      refId,
      status,
      timestamp: new Date()
    });
    await activity.save();
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
};

module.exports = router;
module.exports.logActivity = logActivity;
