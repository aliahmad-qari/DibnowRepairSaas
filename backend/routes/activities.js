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

module.exports = router;
