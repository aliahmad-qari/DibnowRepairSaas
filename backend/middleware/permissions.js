const User = require('../models/User');
const TeamMember = require('../models/TeamMember');

/**
 * Middleware to check if the user account is active
 * Prevents disabled/expired users from accessing API endpoints
 */
const checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check various forms of disabled status
    if (user.is_disabled || user.status === 'expired' || user.status === 'disabled' || user.status === 'cancelled') {
      return res.status(403).json({ 
        message: 'Account is blocked, disabled or expired', 
        blocked: true 
      });
    }
    
    // Check if account is locked due to failed login attempts
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account is temporarily locked',
        lockedUntil: user.lockUntil
      });
    }
    
    // Store user data in req for downstream middleware to use
    req.userData = user;
    next();
  } catch (error) {
    console.error('[SECURITY] Error checking user status:', error);
    res.status(500).json({ message: 'Internal server error while verifying user status' });
  }
};

/**
 * Middleware to check specific module permissions for a user
 * Note: Shop Owners and Admins bypass these checks automatically
 * 
 * @param {String} requiredModule - The module identifier (e.g., 'dashboard', 'inventory')
 */
const checkPermission = (requiredModule) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId || req.user.id;
      
      // 1. Get user data (use cached from checkUserStatus if available)
      const user = req.userData || await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 2. Admin / Superadmin bypass
      // System administrators have full access everywhere
      if (['admin', 'superadmin'].includes(user.role)) {
        return next();
      }

      // 3. User role logic (Team member vs Shop Owner)
      if (user.role === 'user') {
        
        // Look up if this user belongs to a TeamMember record
        // This is how we distinguish a secondary Team Member from the primary Shop Owner
        const teamMember = await TeamMember.findOne({ userId: user._id });
        
        // If there is no TeamMember record linking to this User, they are a primary Shop Owner
        // Owners bypass module-specific permission checks
        if (!teamMember) {
          return next();
        }

        // 4. Team member permission validation
        // Verify requested module exists in their permissions array
        if (user.permissions && user.permissions.includes(requiredModule)) {
          return next();
        } else {
          console.log(`[SECURITY] Access denied to module '${requiredModule}' for user ${user.email}`);
          return res.status(403).json({ 
            message: `Access denied. Missing '${requiredModule}' permission.`,
            required: requiredModule
          });
        }
      }

      // Default deny fallback
      return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      console.error('[SECURITY] Permission check error:', error);
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

/**
 * Get the effective owner ID for data access
 * For team members, returns their owner's ID
 * For shop owners, returns their own ID
 */
const getEffectiveOwnerId = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return userId;

  if (user.role === 'user') {
    const teamMember = await TeamMember.findOne({ userId: user._id });
    if (teamMember) {
      return teamMember.ownerId;
    }
  }
  return userId;
};

module.exports = {
  checkUserStatus,
  checkPermission,
  getEffectiveOwnerId
};
