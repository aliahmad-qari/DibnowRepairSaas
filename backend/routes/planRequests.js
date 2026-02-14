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
      const user = await User.findById(request.userId);
      if (user) {
        user.planId = request.requestedPlanId;
        // Optionally update expiry if needed, for now just switching plan
        await user.save();
        console.log(`[PlanRequest] Updated user ${user._id} to plan ${request.requestedPlanId}`);
      }
    }

    res.json(request);
  } catch (error) {
    console.error('Update Plan Request Status Error:', error);
    res.status(500).json({ message: 'Failed to update request status' });
  }
});

module.exports = router;
