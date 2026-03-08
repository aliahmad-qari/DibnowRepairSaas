const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlanRequest = require('../models/PlanRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, adminOnly } = require('../middleware/auth');

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

// Get all requests (Admin View - Admin & SuperAdmin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    console.log('[PlanRequests] GET / - Fetching all plan requests');
    
    // Check for filters
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await PlanRequest.find(query)
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance and to avoid population issues

    console.log(`[PlanRequests] Found ${requests.length} requests`);
    
    // Manually populate user data if needed
    const populatedRequests = await Promise.all(requests.map(async (req) => {
      try {
        const user = await User.findById(req.userId).select('name email').lean();
        return {
          ...req,
          userId: user || { name: 'Unknown', email: 'N/A' }
        };
      } catch (err) {
        console.error(`[PlanRequests] Error populating user for request ${req._id}:`, err);
        return req;
      }
    }));

    console.log('[PlanRequests] Returning populated requests');
    res.json(populatedRequests);
  } catch (error) {
    console.error('[PlanRequests] Get Plan Requests Error:', error);
    res.status(500).json({ message: 'Failed to fetch plan requests' });
  }
});

// Update request status (Approve/Deny - Admin & SuperAdmin only)
router.put('/:id/status', authenticateToken, adminOnly, async (req, res) => {
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
          
          // Get plan details to set expiry date
          const Plan = require('../models/Plan');
          const plan = await Plan.findById(request.requestedPlanId);
          
          if (plan) {
            const planDurationDays = plan.planDuration || 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + planDurationDays);
            
            user.planId = request.requestedPlanId;
            user.planName = request.requestedPlanName;
            user.status = 'active';
            user.planStartDate = new Date();
            user.planExpireDate = expiryDate;
            await user.save();
            
            console.log(`[PlanRequest] ✅ Successfully updated user ${user._id} from plan "${oldPlanId}" to plan "${request.requestedPlanId}" with expiry: ${expiryDate}`);
          } else {
            user.planId = request.requestedPlanId;
            user.status = 'active';
            await user.save();
            console.log(`[PlanRequest] ✅ Successfully updated user ${user._id} from plan "${oldPlanId}" to plan "${request.requestedPlanId}" (plan not found, no expiry set)`);
          }
          
          // Create subscription record
          const Subscription = require('../models/Subscription');
          if (plan) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan.planDuration || 30));
            const subscription = new Subscription({
              userId: user._id,
              planId: request.requestedPlanId,
              status: 'active',
              startDate: new Date(),
              endDate: endDate,
              paymentMethod: 'manual',
              paymentId: request.transactionId,
              amount: request.amount,
              currency: request.currency
            });
            await subscription.save();
            console.log(`[PlanRequest] ✅ Created subscription for user ${user._id}`);
            
            // Create notifications for approval
            // 1. Notification for user
            await Notification.create({
              userId: user._id.toString(),
              ownerId: user._id,
              title: 'Plan Upgrade Approved',
              message: `Your plan upgrade to ${request.requestedPlanName} has been approved successfully. Your new plan is now active!`,
              type: 'success'
            });
            
            // 2. Notification for admin
            await Notification.create({
              userId: 'global',
              title: 'Plan Upgrade Approved',
              message: `Plan upgrade for ${user.name} to ${request.requestedPlanName} has been approved successfully.`,
              type: 'success'
            });
            
            console.log(`[PlanRequest] ✅ Created approval notifications`);
          }
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
