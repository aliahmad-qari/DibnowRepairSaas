const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlanRequest = require('../models/PlanRequest');
const User = require('../models/User');

// Middleware to check authentication (simplified for this context)
// In a real app, use proper JWT middleware
const requireAuth = async (req, res, next) => {
  // Assuming req.user is populated by global middleware or we verify token here
  // For now, we trust the endpoints are protected or called with valid context
  next();
};

// Create a new plan request
router.post('/', async (req, res) => {
  try {
    const { 
      userId, shopName, currentPlanId, currentPlanName, 
      requestedPlanId, requestedPlanName, transactionId, 
      amount, currency, manualMethod, notes 
    } = req.body;

    console.log('[PlanRequest] Creating plan request with userId:', userId, 'type:', typeof userId);

    const newRequest = new PlanRequest({
      userId,
      shopName,
      currentPlanId,
      currentPlanName,
      requestedPlanId,
      requestedPlanName,
      transactionId,
      amount,
      currency,
      manualMethod,
      notes
    });

    await newRequest.save();
    console.log('[PlanRequest] Plan request created successfully. Stored userId:', newRequest.userId);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create Plan Request Error:', error);
    res.status(500).json({ message: 'Failed to submit plan request' });
  }
});

// Get all requests (Admin View)
router.get('/', async (req, res) => {
  try {
    // Check for filters
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await PlanRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(requests);
  } catch (error) {
    console.error('Get Plan Requests Error:', error);
    res.status(500).json({ message: 'Failed to fetch plan requests' });
  }
});

// Update request status (Approve/Deny)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminId, invoiceStatus } = req.body;

    const request = await PlanRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.processedAt = new Date();
    if (adminId) request.processedBy = adminId;
    if (invoiceStatus) request.invoiceStatus = invoiceStatus;

    await request.save();

    // IF APPROVED: Update the User's Plan
    if (status === 'approved') {
      try {
        // Get the userId - handle ObjectId, populated object, or string formats
        let userIdValue = request.userId;
        
        // If userId is populated (has _id property), extract it
        if (userIdValue && typeof userIdValue === 'object' && userIdValue._id) {
          userIdValue = userIdValue._id;
        }
        
        // Convert to string for logging
        const userIdStr = userIdValue?.toString() || userIdValue;
        console.log(`[PlanRequest] Attempting to update user plan. UserId: ${userIdStr}`);
        
        // Find the user using findById with the value
        let user = null;
        
        // Try direct findById first
        user = await User.findById(userIdValue);
        
        // If not found and it's a string, try as ObjectId
        if (!user && typeof userIdValue === 'string' && mongoose.Types.ObjectId.isValid(userIdValue)) {
          user = await User.findById(new mongoose.Types.ObjectId(userIdValue));
        }
        
        if (user) {
          const oldPlanId = user.planId;
          user.planId = request.requestedPlanId;
          await user.save();
          console.log(`[PlanRequest] ✅ Successfully updated user ${user._id} from plan "${oldPlanId}" to plan "${request.requestedPlanId}"`);
        } else {
          console.error(`[PlanRequest] ❌ User not found with userId: ${userIdStr}`);
          // Log all users for debugging
          const allUsers = await User.find({}, '_id email name planId').limit(5);
          console.log(`[PlanRequest] Available users in DB:`, allUsers.map(u => ({ _id: u._id.toString(), email: u.email, planId: u.planId })));
        }
      } catch (userError) {
        console.error(`[PlanRequest] ❌ Error updating user plan:`, userError);
      }
    }

    res.json(request);
  } catch (error) {
    console.error('Update Plan Request Status Error:', error);
    res.status(500).json({ message: 'Failed to update request status' });
  }
});

module.exports = router;
