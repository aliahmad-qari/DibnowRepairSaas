const User = require('../models/User');

// Permission middleware to check if user has access to specific modules
const checkPermission = (requiredModule) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is active (only for team members)
      if (user.role === 'user' && user.status !== 'active') {
        return res.status(403).json({ 
          message: 'You have been blocked. Please contact your account owner.',
          blocked: true 
        });
      }

      // Owner/Admin always has access - skip permission check
      if (user.role === 'owner' || user.role === 'admin' || user.role === 'superadmin') {
        return next();
      }

      // Only check permissions for team members who have a permissions array
      if (user.role === 'user' && user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
        if (!user.permissions.includes(requiredModule)) {
          return res.status(403).json({ 
            message: 'Access denied. You do not have permission to access this module.',
            missingPermission: requiredModule 
          });
        }
      }

      // If user has no permissions array, they are an owner - allow access
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Middleware to check if user is active (for all authenticated routes)
const checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is active (only for team members, not admin/superadmin)
    if (user.role === 'user' && user.status !== 'active') {
      return res.status(403).json({ 
        message: 'You have been blocked. Please contact your account owner.',
        blocked: true 
      });
    }

    next();
  } catch (error) {
    console.error('User status check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkPermission,
  checkUserStatus
};