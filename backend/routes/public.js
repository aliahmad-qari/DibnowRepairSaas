const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const User = require('../models/User');
const { apiLimiter, securityHeaders } = require('../middleware/security');

// Apply security middleware
router.use(securityHeaders);

// Rate limiting for public endpoints
router.use(apiLimiter);

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Get repair status by tracking ID
router.get('/repair-status/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Validate tracking ID format
    if (!trackingId || trackingId.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tracking ID format'
      });
    }

    const repair = await Repair.findOne({ trackingId })
      .populate('ownerId', 'name company email phone address');

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found. Please check your tracking ID.'
      });
    }

    // Check if public viewing is enabled
    if (!repair.publicView) {
      return res.status(403).json({
        success: false,
        message: 'This repair is not available for public tracking.'
      });
    }

    // Calculate progress percentage
    const statusProgress = {
      'pending': 10,
      'diagnosing': 25,
      'in_progress': 50,
      'parts_ordered': 70,
      'completed': 90,
      'ready': 95,
      'delivered': 100,
      'cancelled': 0,
      'refunded': 0
    };

    const progressPercentage = statusProgress[repair.status] || 0;

    // Build response
    const response = {
      success: true,
      repair: {
        trackingId: repair.trackingId,
        customerName: repair.customerName,
        customerEmail: repair.customerEmail,
        customerPhone: repair.customerPhone,
        device: repair.device,
        deviceModel: repair.deviceModel,
        serialNumber: repair.serialNumber,
        description: repair.description,
        status: repair.status,
        priority: repair.priority,
        category: repair.category,
        brand: repair.brand,
        estimatedCost: repair.estimatedCost,
        finalCost: repair.finalCost,
        paymentStatus: repair.paymentStatus,
        estimatedCompletionDate: repair.estimatedCompletionDate,
        actualCompletionDate: repair.actualCompletionDate,
        createdAt: repair.createdAt,
        updatedAt: repair.updatedAt,
        progressPercentage,
        statusHistory: repair.statusHistory.map(h => ({
          status: h.status,
          note: h.note,
          updatedBy: h.updatedBy ? h.updatedBy.toString() : undefined,
          timestamp: h.timestamp
        })),
        publicViewEnabled: repair.publicView,
        shop: repair.ownerId ? {
          name: repair.ownerId.name || 'Repair Shop',
          company: repair.ownerId.company,
          email: repair.ownerId.email,
          phone: repair.ownerId.phone,
          address: repair.ownerId.address
        } : undefined
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Public repair status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching repair details'
    });
  }
});

// Search repairs by email
router.get('/repair-status/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const repairs = await Repair.find({
      customerEmail: email.toLowerCase(),
      publicView: true
    })
      .select('trackingId device status createdAt estimatedCost finalCost paymentStatus')
      .sort({ createdAt: -1 })
      .limit(10);

    if (repairs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No repairs found for this email address.'
      });
    }

    res.json({
      success: true,
      count: repairs.length,
      repairs: repairs.map(r => ({
        trackingId: r.trackingId,
        device: r.device,
        status: r.status,
        createdAt: r.createdAt,
        estimatedCost: r.estimatedCost,
        finalCost: r.finalCost,
        paymentStatus: r.paymentStatus
      }))
    });
  } catch (error) {
    console.error('Public repair search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching repairs'
    });
  }
});

// Validate tracking ID format
router.get('/repair-validate/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const repair = await Repair.findOne({ trackingId })
      .select('trackingId publicView status')
      .populate('ownerId', 'name company');

    if (!repair) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid tracking ID'
      });
    }

    if (!repair.publicView) {
      return res.status(403).json({
        success: false,
        valid: false,
        message: 'This repair is not available for public tracking'
      });
    }

    res.json({
      success: true,
      valid: true,
      trackingId: repair.trackingId,
      shopName: repair.ownerId?.name || 'Repair Shop',
      status: repair.status
    });
  } catch (error) {
    console.error('Tracking ID validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating tracking ID'
    });
  }
});

module.exports = router;
