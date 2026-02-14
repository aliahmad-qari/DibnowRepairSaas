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

      // Identify current plan. planId is usually the plan name or a slug
      let plan = await Plan.findOne({ name: user.planId.toUpperCase() });
      
      // Fallback for common mappings
      if (!plan) {
         if (user.planId === 'starter') plan = await Plan.findOne({ name: 'FREE TRIAL' });
         else if (user.planId === 'basic') plan = await Plan.findOne({ name: 'BASIC' });
         else if (user.planId === 'premium') plan = await Plan.findOne({ name: 'PREMIUM' });
         else if (user.planId === 'gold') plan = await Plan.findOne({ name: 'GOLD' });
      }

      // Final fallback to FREE TRIAL if still not found
      if (!plan) plan = await Plan.findOne({ name: 'FREE TRIAL' });
      
      if (!plan) return res.status(500).json({ message: 'Plan configuration not found' });

      const limit = plan.limits ? plan.limits[resourceType] : undefined;
      
      // If limit is -1 or null, it's unlimited. If undefined, we don't enforce here.
      if (limit === undefined || limit === -1 || limit === null) return next();

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

      if (currentCount >= limit) {
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
      console.error('Limit check error:', error);
      res.status(500).json({ message: 'Error verifying resource limits' });
    }
  };
};

module.exports = checkLimits;
