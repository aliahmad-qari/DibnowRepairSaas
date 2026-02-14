const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const { authenticateToken } = require('../middleware/auth');
const checkLimits = require('../middleware/checkLimits');

// Get team members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await TeamMember.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team' });
  }
});

// Add team member
router.post('/', authenticateToken, checkLimits('teamMembers'), async (req, res) => {
  try {
    const newMember = new TeamMember({
      ...req.body,
      ownerId: req.user.userId
    });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ message: 'Error creating team member' });
  }
});

// Update team member
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await TeamMember.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Member not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating member' });
  }
});

module.exports = router;
