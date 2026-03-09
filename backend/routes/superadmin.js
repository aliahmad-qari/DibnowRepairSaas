const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, superAdminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Activity = require('../models/Activity');
const Currency = require('../models/Currency');
const Announcement = require('../models/Announcement');
const FeatureFlag = require('../models/FeatureFlag');
const SupportTicket = require('../models/SupportTicket');

// Apply authentication and admin-only middleware to all routes
router.use(authenticateToken);
router.use(adminOnly);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Superadmin routes working', user: req.user });
});

// ==================== DASHBOARD ENDPOINTS ====================

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get all users
    const allUsers = await User.find({});
    const totalUsers = allUsers.length;

    // Get shops (users with role 'user')
    const shops = allUsers.filter(u => u.role === 'user');
    const totalShops = shops.length;

    // Get active subscribers (users with active status and paid plans)
    const activeSubscribers = allUsers.filter(u =>
      u.status === 'active' &&
      u.planName &&
      u.planName.toLowerCase() !== 'free trial'
    );
    const activeSubs = activeSubscribers.length;

    // Calculate total revenue from completed transactions
    const completedTransactions = await Transaction.find({ status: 'completed' });
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      totalUsers,
      totalShops,
      totalRevenue,
      activeSubs
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
});

// Get chart data (6-month revenue and signup trends)
router.get('/dashboard/chart-data', async (req, res) => {
  try {
    const chartData = [];
    const now = new Date();

    // Generate data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      // Get revenue for this month
      const monthTransactions = await Transaction.find({
        status: 'completed',
        createdAt: { $gte: monthDate, $lt: nextMonthDate }
      });
      const revenue = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Get signups for this month
      const signups = await User.countDocuments({
        createdAt: { $gte: monthDate, $lt: nextMonthDate }
      });

      chartData.push({
        name: monthDate.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(revenue),
        signups
      });
    }

    res.json(chartData);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ message: 'Failed to fetch chart data', error: error.message });
  }
});

// Get system health status
router.get('/system/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await User.countDocuments({}) >= 0 ? 'STABLE' : 'ERROR';

    // Get database stats
    const totalUsers = await User.countDocuments({});
    const totalTransactions = await Transaction.countDocuments({});

    res.json({
      apiCluster: 'STABLE',
      database: dbStatus,
      uptime: '99.9%',
      security: 'ACTIVE',
      stats: {
        totalUsers,
        totalTransactions
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ message: 'Failed to fetch system health', error: error.message });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// Create new user
router.post('/create-user', superAdminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      role: 'user',
      status: 'active',
      emailVerified: true // Auto-verify for superadmin created users
    });

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// Get all users
router.get('/users', superAdminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Disable user
router.put('/users/:id/disable', superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'disabled' },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({ message: 'Failed to disable user', error: error.message });
  }
});

// Enable user
router.put('/users/:id/enable', superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Enable user error:', error);
    res.status(500).json({ message: 'Failed to enable user', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// ==================== SHOP MANAGEMENT ENDPOINTS ====================

// Get all shops with stats
router.get('/shops', async (req, res) => {
  try {
    const shops = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });

    // Calculate revenue for each shop
    const shopsWithStats = await Promise.all(shops.map(async (shop) => {
      const transactions = await Transaction.find({ userId: shop._id, status: 'completed' });
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        ...shop.toObject(),
        totalRevenue,
        lastActive: shop.lastLogin || shop.updatedAt
      };
    }));

    res.json(shopsWithStats);
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ message: 'Failed to fetch shops', error: error.message });
  }
});

// ==================== REVENUE ANALYTICS ENDPOINTS ====================

// Get revenue overview
router.get('/revenue/overview', async (req, res) => {
  try {
    const completedTransactions = await Transaction.find({ status: 'completed' });
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate average transaction
    const avgTransaction = completedTransactions.length > 0
      ? totalRevenue / completedTransactions.length
      : 0;

    // Calculate refunds
    const refunds = await Transaction.find({
      status: 'refunded'
    });
    const totalRefunds = refunds.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      totalRevenue,
      avgTransaction,
      totalRefunds,
      transactionCount: completedTransactions.length
    });
  } catch (error) {
    console.error('Revenue overview error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue overview', error: error.message });
  }
});

// Get revenue chart data
router.get('/revenue/chart', async (req, res) => {
  try {
    const chartData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthTransactions = await Transaction.find({
        status: 'completed',
        createdAt: { $gte: monthDate, $lt: nextMonthDate }
      });
      const revenue = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      const refundTransactions = await Transaction.find({
        status: 'refunded',
        createdAt: { $gte: monthDate, $lt: nextMonthDate }
      });
      const refunds = refundTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      chartData.push({
        name: monthDate.toLocaleString('default', { month: 'short' }),
        revenue: Math.round(revenue),
        refunds: Math.round(refunds)
      });
    }

    res.json(chartData);
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue chart', error: error.message });
  }
});

// ==================== AUDIT LOGS ENDPOINTS ====================

// Get all audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { actionType, userId } = req.query;
    const filter = {};

    if (actionType) filter.actionType = new RegExp(actionType, 'i');
    if (userId) filter.userId = userId;

    const logs = await Activity.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});

// ==================== CURRENCY ENDPOINTS ====================

router.get('/currencies', async (req, res) => {
  try {
    const currencies = await Currency.find().sort({ countryCode: 1 });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch currencies', error: error.message });
  }
});

router.post('/currencies', async (req, res) => {
  try {
    const currency = new Currency(req.body);
    await currency.save();
    res.status(201).json(currency);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create currency', error: error.message });
  }
});

router.delete('/currencies/:id', async (req, res) => {
  try {
    await Currency.findByIdAndDelete(req.params.id);
    res.json({ message: 'Currency deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete currency', error: error.message });
  }
});

// ==================== ANNOUNCEMENT ENDPOINTS ====================

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update announcement', error: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
});

// ==================== FEATURE FLAG ENDPOINTS ====================

router.get('/features', async (req, res) => {
  try {
    const flags = await FeatureFlag.find().sort({ group: 1 });
    res.json(flags);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feature flags', error: error.message });
  }
});

router.put('/features/:id/toggle', async (req, res) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ message: 'Feature flag not found' });

    flag.active = !flag.active;
    await flag.save();
    res.json(flag);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle feature flag', error: error.message });
  }
});

// ==================== SUPPORT TICKET ENDPOINTS ====================

router.get('/support/tickets', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};

    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
});

router.put('/support/tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
});

module.exports = router;
