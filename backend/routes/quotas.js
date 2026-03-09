const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Repair = require('../models/Repair');
const Inventory = require('../models/Inventory');
const TeamMember = require('../models/TeamMember');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

// ========== GET REAL-TIME QUOTA STATUS ==========
// This endpoint MUST be called after plan upgrades to get fresh quota data
// Returns real usage vs limits from database (NOT cached/hardcoded)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // STEP 1: Get user with populated plan reference
    const user = await User.findById(userId).populate('planId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // STEP 2: If no plan (Free Trial), return minimal quotas
    if (!user.planId) {
      return res.json({
        success: true,
        planId: null,
        planName: 'Free Trial',
        limits: {
          repairs: { used: 0, limit: 1, percentage: 0 },
          stock: { used: 0, limit: 1, percentage: 0 },
          team: { used: 0, limit: 1, percentage: 0 },
          brands: { used: 0, limit: 1, percentage: 0 },
          categories: { used: 0, limit: 1, percentage: 0 },
          aiDiagnostics: false
        },
        status: 'free_trial'
      });
    }

    const plan = user.planId;
    const planLimits = plan.limits || {};

    // STEP 3: Get REAL-TIME usage from database (all in parallel for performance)
    const [repairsUsed, stockUsed, teamUsed, brandUsed, categoryUsed] = await Promise.all([
      Repair.countDocuments({ ownerId: userId }),
      Inventory.countDocuments({ ownerId: userId }),
      TeamMember.countDocuments({ ownerId: userId }),
      Brand.countDocuments({ ownerId: userId }),
      Category.countDocuments({ ownerId: userId })
    ]);

    // STEP 4: Extract limits from plan limits object (try multiple key names for compatibility)
    const repairsLimit = planLimits.repairsPerMonth || planLimits.repairLimit || planLimits.repairs || 5;
    const stockLimit = planLimits.inventoryItems || planLimits.stockLimit || planLimits.stock || 5;
    const teamLimit = planLimits.teamMembers || planLimits.teamLimit || planLimits.team || 3;
    const brandsLimit = planLimits.brands || planLimits.brandLimit || 5;
    const categoriesLimit = planLimits.categories || planLimits.categoryLimit || 5;
    const aiDiagnosticsEnabled = planLimits.aiDiagnostics || false;

    // STEP 5: Calculate usage percentages
    const calculatePercent = (used, limit) => {
      if (!limit || limit === 0 || limit >= 999) return 0;
      return Math.min(100, Math.floor((used / limit) * 100));
    };

    // STEP 6: Return complete quota status with database-driven values
    res.json({
      success: true,
      planId: plan._id.toString(),
      planName: plan.name,
      planPrice: plan.price,
      planCurrency: plan.currency,
      planExpiry: user.planExpireDate || null,
      limits: {
        repairs: {
          used: repairsUsed,
          limit: repairsLimit,
          percentage: calculatePercent(repairsUsed, repairsLimit)
        },
        stock: {
          used: stockUsed,
          limit: stockLimit,
          percentage: calculatePercent(stockUsed, stockLimit)
        },
        team: {
          used: teamUsed,
          limit: teamLimit,
          percentage: calculatePercent(teamUsed, teamLimit)
        },
        brands: {
          used: brandUsed,
          limit: brandsLimit,
          percentage: calculatePercent(brandUsed, brandsLimit)
        },
        categories: {
          used: categoryUsed,
          limit: categoriesLimit,
          percentage: calculatePercent(categoryUsed, categoriesLimit)
        },
        aiDiagnostics: aiDiagnosticsEnabled
      },
      status: 'active',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[QUOTAS] Error fetching quota status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quota status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========== CHECK BEFORE CREATING RESOURCE ==========
// Call before POST to verify user has quota remaining
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { action, count = 1 } = req.body;
    
    if (!action) {
      return res.status(400).json({ message: 'Action type required' });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId).populate('planId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Free trial or no plan = very limited
    if (!user.planId) {
      return res.json({
        allowed: false,
        message: 'No active plan - upgrade required',
        planRequired: true
      });
    }

    const plan = user.planId;
    const limits = plan.limits || {};

    // Map action names to plan limit field names
    const actionMap = {
      'repair': { field: 'repairsPerMonth', dbModel: Repair, countField: 'ownerId' },
      'inventory': { field: 'inventoryItems', dbModel: Inventory, countField: 'ownerId' },
      'team_member': { field: 'teamMembers', dbModel: TeamMember, countField: 'ownerId' },
      'brand': { field: 'brands', dbModel: Brand, countField: 'ownerId' },
      'category': { field: 'categories', dbModel: Category, countField: 'ownerId' },
      'ai_diagnostic': { field: 'aiDiagnostics', type: 'boolean' }
    };

    const actionConfig = actionMap[action];
    if (!actionConfig) {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    // Check boolean toggle (e.g., AI Diagnostics)
    if (actionConfig.type === 'boolean') {
      const enabled = limits[actionConfig.field] === true;
      return res.json({
        allowed: enabled,
        message: enabled ? 'Feature enabled' : 'Feature not available in this plan',
        feature: action,
        enabled
      });
    }

    // Check numeric limits
    const limit = limits[actionConfig.field];
    
    // If limit is missing, unlimited (999), or -1, allow unlimited
    if (!limit || limit === -1 || limit >= 999) {
      return res.json({
        allowed: true,
        message: 'Unlimited quota',
        current: 0,
        limit: 'Unlimited'
      });
    }

    // Get current count from database
    const used = await actionConfig.dbModel.countDocuments({ 
      [actionConfig.countField]: userId 
    });

    const allowed = (used + count) <= limit;

    res.json({
      allowed,
      current: used,
      limit,
      action,
      message: allowed 
        ? `OK: can add ${count} more (${used}/${limit})` 
        : `Limit reached: ${used}/${limit} used`
    });

  } catch (error) {
    console.error('[QUOTAS] Error checking quota:', error);
    res.status(500).json({
      success: false,
      message: 'Quota check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
