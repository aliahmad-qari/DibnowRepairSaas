const User = require('../models/User');

const checkPlanExpiry = async (req, res, next) => {
  try {
    if (!req.user?.userId) return next();

    const user = await User.findById(req.user.userId);
    if (!user) return next();

    // Check if plan expired
    if (user.planExpireDate && new Date() > user.planExpireDate && user.planStatus === 'active') {
      user.planStatus = 'expired';
      user.status = 'expired';
      await user.save();
      console.log(`[PLAN] Auto-expired plan for user: ${user.email}`);
    }

    next();
  } catch (error) {
    console.error('Plan expiry check error:', error);
    next();
  }
};

module.exports = checkPlanExpiry;
