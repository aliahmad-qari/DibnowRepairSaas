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

const PlanRequest = require('../models/PlanRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Submit manual payment request
router.post('/manual-payment-request', authenticateToken, async (req, res) => {
  try {
    const { planId, transactionId, amount, currency, method, notes } = req.body;
    const userId = req.user.userId;

    console.log('[MANUAL PAYMENT] ========== NEW REQUEST ==========');
    console.log('[MANUAL PAYMENT] Request received:', { userId, planId, amount, method, transactionId });
    console.log('[MANUAL PAYMENT] Full request body:', req.body);

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      console.error('[MANUAL PAYMENT] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[MANUAL PAYMENT] User found:', { id: user._id, name: user.name, email: user.email });

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      console.error('[MANUAL PAYMENT] Plan not found:', planId);
      return res.status(404).json({ message: 'Plan not found' });
    }
    console.log('[MANUAL PAYMENT] Plan found:', { id: plan._id, name: plan.name });

    // Create plan request
    const planRequest = new PlanRequest({
      userId: userId,
      shopName: user.company || user.name,
      currentPlanId: user.planId || 'starter',
      currentPlanName: user.planId || 'Starter',
      requestedPlanId: plan._id,
      requestedPlanName: plan.name,
      transactionId: transactionId,
      amount: amount,
      currency: currency || 'PKR',
      manualMethod: method || 'Bank Transfer',
      notes: notes,
      status: 'pending',
      invoiceStatus: 'unpaid'
    });

    await planRequest.save();
    console.log('[MANUAL PAYMENT] Plan request saved:', { id: planRequest._id, status: planRequest.status });

    // Create notifications
    // 1. Notification for user
    await Notification.create({
      userId: userId.toString(),
      ownerId: userId,
      title: 'Plan Upgrade Request Submitted',
      message: `Your request to upgrade to ${plan.name} plan has been submitted. It will be reviewed within 2-3 hours.`,
      type: 'info'
    });
    console.log('[MANUAL PAYMENT] User notification created');

    // 2. Notification for admin (global)
    await Notification.create({
      userId: 'global',
      title: 'New Manual Plan Upgrade Request',
      message: `${user.name} has requested to upgrade to ${plan.name} plan. Amount: ${currency} ${amount}`,
      type: 'warning'
    });
    console.log('[MANUAL PAYMENT] Admin notification created');

    console.log('[MANUAL PAYMENT] ========== REQUEST COMPLETE ==========');

    res.json({
      success: true,
      message: 'Payment request submitted successfully. Admin will review and approve.',
      requestId: planRequest._id,
      request: planRequest
    });
  } catch (error) {
    console.error('[MANUAL PAYMENT] ========== ERROR ==========');
    console.error('[MANUAL PAYMENT] Error:', error);
    console.error('[MANUAL PAYMENT] Stack:', error.stack);
    res.status(500).json({ 
      message: 'Error submitting payment request',
      error: error.message 
    });
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

