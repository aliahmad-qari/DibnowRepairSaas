const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');

// ==================== GET ALL PLANS ====================

// Get all active plans (public route - no auth required)
router.get('/all', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort({ price: 1 }) // Sort by price ascending
      .select('_id name description price currency duration features stripePriceId isActive createdAt');

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans'
    });
  }
});

// Get single plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan'
    });
  }
});

module.exports = router;
