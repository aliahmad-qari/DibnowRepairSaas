const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authenticateToken } = require('../middleware/auth');

// Get all complaints for owner
router.get('/', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ ownerId: req.user.userId });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const complaint = new Complaint({
      ...req.body,
      ownerId: req.user.userId
    });
    const newComplaint = await complaint.save();
    res.status(201).json(newComplaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update complaint status or priority
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
