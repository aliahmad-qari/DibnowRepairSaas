const User = require('../models/User');
const Plan = require('../models/Plan');
const Brand = require('../models/Brand');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const TeamMember = require('../models/TeamMember');
const Repair = require('../models/Repair');

/**
 * Middleware to check if a user has exceeded their plan limits
 * @param {string} resourceType - The type of resource to check (e.g., 'brands', 'inventoryItems', 'categories', 'teamMembers', 'repairsPerMonth')
 */
const checkLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      console.log(`[CheckLimits] Checking ${resourceType} for user ${user._id}, planId: ${user.planId}`);

      // Find plan by ObjectId (MongoDB _id)
      let plan = await Plan.findById(user.planId);
      
      // If not found by ID, try finding by name as fallback
      if (!plan && user.planId) {
        plan = await Plan.findOne({ name: new RegExp(user.planId, 'i') });
      }

      // Final fallback to FREE TRIAL
      if (!plan) {
        console.warn(`[CheckLimits] Plan not found for user ${user._id}, using FREE TRIAL`);
        plan = await Plan.findOne({ name: /FREE TRIAL/i });
      }
      
      if (!plan) {
        console.error('[CheckLimits] No plan configuration found in database');
        return res.status(500).json({ message: 'Plan configuration not found' });
      }

      console.log(`[CheckLimits] Using plan: ${plan.name}, limits:`, plan.limits);

      const limit = plan.limits ? plan.limits[resourceType] : undefined;
      
      // If limit is -1, 999, or null, it's unlimited
      if (limit === undefined || limit === -1 || limit === null || limit >= 999) {
        console.log(`[CheckLimits] Unlimited ${resourceType} for plan ${plan.name}`);
        return next();
      }

      let currentCount = 0;
      switch (resourceType) {
        case 'brands':
          currentCount = await Brand.countDocuments({ ownerId: req.user.userId });
          break;
        case 'inventoryItems':
          currentCount = await Inventory.countDocuments({ ownerId: req.user.userId });
          break;
        case 'categories':
          currentCount = await Category.countDocuments({ ownerId: req.user.userId });
          break;
        case 'teamMembers':
          currentCount = await TeamMember.countDocuments({ ownerId: req.user.userId });
          break;
        case 'repairsPerMonth':
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          currentCount = await Repair.countDocuments({ ownerId: req.user.userId, createdAt: { $gte: startOfMonth } });
          break;
        default:
          return next();
      }

      console.log(`[CheckLimits] ${resourceType}: ${currentCount}/${limit}`);

      if (currentCount >= limit) {
        console.warn(`[CheckLimits] Limit reached for ${resourceType}: ${currentCount}/${limit}`);
        return res.status(403).json({
          message: 'Resource limit reached',
          limitHit: true,
          resourceType,
          limit,
          currentCount,
          upgradeRequired: true,
          upgradeMessage: `You have reached the limit of ${limit} ${resourceType} for your current plan (${plan.name}). Please upgrade your tier to add more.`
        });
      }

      next();
    } catch (error) {
      console.error('[CheckLimits] Error:', error);
      res.status(500).json({ message: 'Error verifying resource limits' });
    }
  };
};

module.exports = checkLimits;
