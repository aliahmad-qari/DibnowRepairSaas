const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Users get their own notifications + global notifications
    // Admin/Superadmin get global + their own
    const query = { 
      $or: [
        { userId: userId }, 
        { userId: 'global' },
        { ownerId: userId }
      ]
    };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent overload
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const query = {
      $or: [
        { userId: userId },
        { userId: 'global' },
        { ownerId: userId }
      ],
      read: false
    };
    
    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notification = await Notification.findOneAndDelete({ 
      _id: req.params.id, 
      userId: userId 
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

module.exports = router;
