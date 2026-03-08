const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { authenticateToken } = require('../middleware/auth');

// Ensure user is authenticated for all operations
router.use(authenticateToken);

// GET /api/support-tickets - fetch tickets for the logged in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Fetch user tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch support tickets', error: error.message });
  }
});

// POST /api/support-tickets - create a new ticket
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const ticket = new SupportTicket({
      ...req.body,
      userId
    });
    const saved = await ticket.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(400).json({ message: 'Failed to create support ticket', error: error.message });
  }
});

// Optionally allow user to update their own ticket (status/message)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(400).json({ message: 'Failed to update ticket', error: error.message });
  }
});

module.exports = router;