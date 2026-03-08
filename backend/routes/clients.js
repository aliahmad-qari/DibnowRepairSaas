const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { authenticateToken } = require('../middleware/auth');

// Get all clients for owner
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clients = await Client.find({ ownerId: req.user.userId });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new client
router.post('/', authenticateToken, async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      ownerId: req.user.userId
    });
    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update client
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete client
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
