const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const User = require('../models/User');

// Auth middleware
const { 
  authenticateToken, 
  authorizeRoles,
  optionalAuth 
} = require('../middleware/auth');

// Permission middleware
const { checkPermission, checkUserStatus } = require('../middleware/permissions');

// Security middleware
const { 
  apiLimiter, 
  securityHeaders,
  sanitizeInput 
} = require('../middleware/security');

// Validation middleware
const { repairIdValidation, userIdValidation } = require('../middleware/validation');
const checkLimits = require('../middleware/checkLimits');

// Apply security middleware
router.use(securityHeaders);
router.use(sanitizeInput);

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Track repair by tracking ID (public endpoint)
router.get('/track/:trackingId', optionalAuth, async (req, res) => {
  try {
    const { trackingId } = req.params;

    const repair = await Repair.findOne({ 
      trackingId,
      publicView: true 
    }).populate('ownerId', 'name company email');

    if (!repair) {
      return res.status(404).json({ 
        message: 'Repair not found. Please check your tracking ID.' 
      });
    }

    // Return public details only
    res.json({
      success: true,
      repair: repair.getPublicDetails(),
      shop: {
        name: repair.ownerId?.name || 'Repair Shop',
        company: repair.ownerId?.company,
        email: repair.ownerId?.email
      }
    });
  } catch (error) {
    console.error('Track repair error:', error);
    res.status(500).json({ message: 'Error fetching repair details' });
  }
});

// Search repairs by email (for customers to find their repairs)
router.post('/search', async (req, res) => {
  try {
    const { email, phone, trackingId } = req.body;

    if (!email && !phone && !trackingId) {
      return res.status(400).json({ 
        message: 'Please provide email, phone, or tracking ID' 
      });
    }

    const query = {};
    if (email) query.customerEmail = email.toLowerCase();
    if (phone) query.customerPhone = phone;
    if (trackingId) query.trackingId = trackingId;

    const repairs = await Repair.find(query)
      .select('trackingId device status createdAt estimatedCost finalCost')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: repairs.length,
      repairs: repairs.map(r => ({
        trackingId: r.trackingId,
        device: r.device,
        status: r.status,
        createdAt: r.createdAt,
        estimatedCost: r.estimatedCost,
        finalCost: r.finalCost
      }))
    });
  } catch (error) {
    console.error('Search repairs error:', error);
    res.status(500).json({ message: 'Error searching repairs' });
  }
});

// ==================== PROTECTED ROUTES (Auth Required) ====================

// Get all repairs for logged-in user
router.get('/', authenticateToken, checkUserStatus, checkPermission('repairs'), async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    const query = { ownerId: req.user.userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const repairs = await Repair.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email');

    const total = await Repair.countDocuments(query);

    res.json({
      repairs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get repairs error:', error);
    res.status(500).json({ message: 'Error fetching repairs' });
  }
});

// Get single repair
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const repair = await Repair.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    }).populate('ownerId assignedTo', 'name email');

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    res.json(repair);
  } catch (error) {
    console.error('Get repair error:', error);
    res.status(500).json({ message: 'Error fetching repair' });
  }
});

// Create new repair
router.post('/', authenticateToken, checkUserStatus, checkPermission('repairs'), checkLimits('repairsPerMonth'), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      device,
      deviceModel,
      serialNumber,
      description,
      estimatedCost,
      priority,
      category,
      brand,
      estimatedCompletionDate
    } = req.body;

    // Generate tracking ID (async)
    const trackingId = await Repair.generateTrackingId();

    const repair = new Repair({
      trackingId,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      device,
      deviceModel,
      serialNumber,
      description,
      estimatedCost,
      priority: priority || 'medium',
      category,
      brand,
      estimatedCompletionDate,
      ownerId: req.user.userId,
      statusHistory: [{
        status: 'pending',
        note: 'Repair created',
        updatedBy: req.user.userId
      }]
    });

    await repair.save();

    console.log(`[REPAIR] New repair created: ${trackingId}`);

    res.status(201).json({
      message: 'Repair created successfully',
      repair,
      trackingId
    });
  } catch (error) {
    console.error('Create repair error:', error);
    res.status(500).json({ message: 'Error creating repair' });
  }
});

// Update repair status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, note } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    // Add status update
    repair.addStatusUpdate(status, note, req.user.userId);

    // Send notification if email is provided
    if (repair.customerEmail) {
      // TODO: Integrate with email service
      console.log(`[NOTIFICATION] Status update for ${repair.trackingId}: ${status}`);
    }

    console.log(`[REPAIR] Status updated: ${repair.trackingId} -> ${status}`);

    res.json({
      message: 'Status updated successfully',
      repair
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Update protocol status
router.patch('/:id/protocol-status', authenticateToken, async (req, res) => {
  try {
    const { protocolStatus } = req.body;
    console.log('[REPAIR] Protocol status update request:', { id: req.params.id, protocolStatus, userId: req.user.userId });

    const repair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { protocolStatus },
      { new: true, runValidators: true }
    );

    if (!repair) {
      console.log('[REPAIR] Repair not found for update');
      return res.status(404).json({ message: 'Repair not found' });
    }

    console.log(`[REPAIR] Protocol status updated: ${repair.trackingId} -> ${protocolStatus}`);

    res.json({
      message: 'Protocol status updated successfully',
      repair
    });
  } catch (error) {
    console.error('Update protocol status error:', error);
    res.status(500).json({ message: 'Error updating protocol status', error: error.message });
  }
});

// Update repair
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      device,
      deviceModel,
      serialNumber,
      description,
      estimatedCost,
      finalCost,
      priority,
      category,
      brand,
      estimatedCompletionDate,
      paymentStatus
    } = req.body;

    const repair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      {
        customerName,
        customerEmail: customerEmail?.toLowerCase(),
        customerPhone,
        device,
        deviceModel,
        serialNumber,
        description,
        estimatedCost,
        finalCost,
        priority,
        category,
        brand,
        estimatedCompletionDate,
        paymentStatus
      },
      { new: true, runValidators: true }
    );

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    console.log(`[REPAIR] Updated: ${repair.trackingId}`);

    res.json({
      message: 'Repair updated successfully',
      repair
    });
  } catch (error) {
    console.error('Update repair error:', error);
    res.status(500).json({ message: 'Error updating repair' });
  }
});

// Delete repair
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const repair = await Repair.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    console.log(`[REPAIR] Deleted: ${repair.trackingId}`);

    res.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    console.error('Delete repair error:', error);
    res.status(500).json({ message: 'Error deleting repair' });
  }
});

// Add note to repair
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    const repair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      {
        $push: {
          notes: {
            content,
            author: req.user.userId,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    res.json({
      message: 'Note added successfully',
      repair
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Error adding note' });
  }
});

// Get repair statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.userId;
    
    const stats = await Repair.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });

    const totalRepairs = await Repair.countDocuments({ ownerId });
    const pendingRepairs = await Repair.countDocuments({ ownerId, status: 'pending' });
    const completedRepairs = await Repair.countDocuments({ ownerId, status: { $in: ['completed', 'delivered'] } });

    res.json({
      totalRepairs,
      pendingRepairs,
      completedRepairs,
      statusBreakdown: statusCounts
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: Get all repairs across all users
router.get('/admin/all', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, ownerId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (ownerId) query.ownerId = ownerId;

    const repairs = await Repair.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('ownerId', 'name email company');

    const total = await Repair.countDocuments(query);

    res.json({
      repairs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get repairs error:', error);
    res.status(500).json({ message: 'Error fetching repairs' });
  }
});

// Super Admin: Delete any repair
router.delete('/admin/:id', authenticateToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    console.log(`[ADMIN] Deleted repair: ${repair.trackingId}`);

    res.json({ message: 'Repair deleted by admin' });
  } catch (error) {
    console.error('Admin delete repair error:', error);
    res.status(500).json({ message: 'Error deleting repair' });
  }
});

// ==================== TRACKING CONTROL ROUTES ====================

// User/Admin: Toggle public view for a repair
router.patch('/:id/public-view', authenticateToken, async (req, res) => {
  try {
    const { publicView } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    repair.publicView = publicView;
    await repair.save();

    console.log(`[REPAIR] Public view ${publicView ? 'enabled' : 'disabled'}: ${repair.trackingId}`);

    res.json({
      message: `Public view ${publicView ? 'enabled' : 'disabled'} successfully`,
      publicView: repair.publicView
    });
  } catch (error) {
    console.error('Toggle public view error:', error);
    res.status(500).json({ message: 'Error updating public view setting' });
  }
});

// User/Admin: Regenerate tracking ID
router.post('/:id/regenerate-tracking', authenticateToken, async (req, res) => {
  try {
    const repair = await Repair.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    // Generate new tracking ID
    const newTrackingId = await Repair.regenerateTrackingId(repair.trackingId);

    // Store old tracking ID in history for reference
    const oldTrackingId = repair.trackingId;
    repair.trackingId = newTrackingId;
    repair.statusHistory.push({
      status: repair.status,
      note: `Tracking ID regenerated from ${oldTrackingId} to ${newTrackingId}`,
      updatedBy: req.user.userId,
      timestamp: new Date()
    });

    await repair.save();

    console.log(`[REPAIR] Tracking ID regenerated: ${oldTrackingId} -> ${newTrackingId}`);

    res.json({
      message: 'Tracking ID regenerated successfully',
      oldTrackingId,
      newTrackingId
    });
  } catch (error) {
    console.error('Regenerate tracking ID error:', error);
    res.status(500).json({ message: 'Error regenerating tracking ID' });
  }
});

// User/Admin: Update status with timeline note
router.patch('/:id/timeline', authenticateToken, async (req, res) => {
  try {
    const { status, note, sendNotification } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      ownerId: req.user.userId
    });

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    // Add status update
    repair.status = status;
    repair.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.userId,
      timestamp: new Date()
    });

    // Set completion date if status is completed or ready
    if (status === 'completed' || status === 'ready') {
      repair.actualCompletionDate = new Date();
    }

    await repair.save();

    // Send notification if requested
    if (sendNotification && repair.customerEmail) {
      // TODO: Integrate with email/SMS service
      console.log(`[NOTIFICATION] Status update for ${repair.trackingId}: ${status}`);
    }

    console.log(`[REPAIR] Timeline updated: ${repair.trackingId} -> ${status}`);

    res.json({
      message: 'Timeline updated successfully',
      status: repair.status,
      statusHistory: repair.statusHistory
    });
  } catch (error) {
    console.error('Update timeline error:', error);
    res.status(500).json({ message: 'Error updating timeline' });
  }
});

// Admin: Update any repair's public view setting
router.patch('/admin/:id/public-view', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { publicView } = req.body;

    const repair = await Repair.findById(req.params.id);

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    repair.publicView = publicView;
    await repair.save();

    console.log(`[ADMIN] Public view updated for ${repair.trackingId}: ${publicView}`);

    res.json({
      message: 'Public view setting updated',
      publicView: repair.publicView
    });
  } catch (error) {
    console.error('Admin toggle public view error:', error);
    res.status(500).json({ message: 'Error updating public view setting' });
  }
});

// Admin: Regenerate any repair's tracking ID
router.post('/admin/:id/regenerate-tracking', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);

    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    const oldTrackingId = repair.trackingId;
    const newTrackingId = await Repair.regenerateTrackingId(oldTrackingId);

    repair.trackingId = newTrackingId;
    repair.statusHistory.push({
      status: repair.status,
      note: `Admin regenerated tracking ID from ${oldTrackingId}`,
      updatedBy: req.user.userId,
      timestamp: new Date()
    });

    await repair.save();

    console.log(`[ADMIN] Tracking ID regenerated: ${oldTrackingId} -> ${newTrackingId}`);

    res.json({
      message: 'Tracking ID regenerated successfully',
      oldTrackingId,
      newTrackingId
    });
  } catch (error) {
    console.error('Admin regenerate tracking ID error:', error);
    res.status(500).json({ message: 'Error regenerating tracking ID' });
  }
});

module.exports = router;
