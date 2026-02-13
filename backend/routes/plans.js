const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// ==================== GET ALL PLANS ====================

// Get all active plans (public route - no auth required)
router.get('/all', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort({ price: 1 }) // Sort by price ascending
      .select('_id name description price currency duration features stripePriceId isActive limits createdAt');

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

// ==================== MANAGEMENT ROUTES (SUPERADMIN ONLY) ====================

// Add plan
router.post('/add', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, description, price, currency, duration, features, stripePriceId, limits } = req.body;

    const plan = new Plan({
      name,
      description: description || name,
      price,
      currency: currency || 'GBP',
      duration: duration || 30,
      features: features || [],
      stripePriceId,
      limits: limits || {}
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? 'Plan name must be unique' : 'Error creating plan'
    });
  }
});

// Update plan
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, description, price, currency, duration, features, stripePriceId, isActive, limits } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        currency,
        duration,
        features,
        stripePriceId,
        isActive,
        limits,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plan'
    });
  }
});

// Delete plan
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plan'
    });
  }
});

module.exports = router;
