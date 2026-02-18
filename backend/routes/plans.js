const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// ==================== GET ALL PLANS ====================

// Get all active plans (public route - no auth required)
router.get('/all', async (req, res) => {
  try {
    console.log('[PLANS] Fetching all plans...');
    const plans = await Plan.find({ isActive: true })
      .sort({ price: 1 }) // Sort by price ascending
      .select('_id name description price currency duration features stripePriceId isActive limits createdAt');

    console.log('[PLANS] Found plans:', plans.length);
    console.log('[PLANS] Plans data:', JSON.stringify(plans, null, 2));

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('[PLANS] Get plans error:', error);
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

const PlanRequest = require('../models/PlanRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Submit manual payment request
router.post('/manual-payment-request', authenticateToken, async (req, res) => {
  try {
    const { planId, transactionId, amount, currency, method, notes } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // DO NOT activate plan immediately - wait for admin approval
    // Create plan request for admin approval
    const planRequest = new PlanRequest({
      userId,
      shopName: user.company || user.name,
      currentPlanId: user.planId || 'starter',
      currentPlanName: user.planName || 'Starter',
      requestedPlanId: plan._id.toString(),
      requestedPlanName: plan.name,
      transactionId,
      amount,
      currency: currency || 'PKR',
      manualMethod: method || 'Bank Transfer',
      notes,
      status: 'pending', // Changed from 'approved' to 'pending'
      invoiceStatus: 'pending' // Changed from 'paid' to 'pending'
    });
    await planRequest.save();

    // Notify user that request is pending
    await Notification.create({
      userId: userId.toString(),
      ownerId: userId,
      title: 'Payment Request Submitted',
      message: `Your payment request for ${plan.name} plan has been submitted. Admin will review and activate your plan within 2-4 hours.`,
      type: 'info'
    });

    // Notify admin about new payment request
    await Notification.create({
      userId: 'global',
      title: 'New Manual Payment Request',
      message: `${user.name} submitted a manual payment request for ${plan.name} plan. Transaction ID: ${transactionId}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Payment request submitted successfully. Your plan will be activated after admin approval.',
      requestId: planRequest._id
    });
  } catch (error) {
    console.error('[MANUAL PAYMENT] Error:', error);
    res.status(500).json({ message: 'Error submitting payment request' });
  }
});

// Get user's plan requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const requests = await PlanRequest.find({ userId })
      .sort({ createdAt: -1 })
      .populate('processedBy', 'name email');

    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('[MANUAL PAYMENT] Get requests error:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});



module.exports = router;


// ==================== MANUAL PAYMENT REQUEST ====================

