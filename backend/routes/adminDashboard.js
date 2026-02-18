const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Repair = require('../models/Repair');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const TeamMember = require('../models/TeamMember');
const Complaint = require('../models/Complaint');
const Transaction = require('../models/Transaction');
const PlanRequest = require('../models/PlanRequest');
const { authenticateToken } = require('../middleware/auth');

// Admin aggregation endpoint - platform-wide statistics
router.get('/aggregation', authenticateToken, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const [
      allUsers,
      allRepairs,
      allSales,
      allInventory,
      allTeams,
      allComplaints,
      allTransactions,
      allPlanRequests
    ] = await Promise.all([
      User.find({}),
      Repair.find({}),
      Sale.find({}),
      Inventory.find({}),
      TeamMember.find({}),
      Complaint.find({}),
      Transaction.find({}),
      PlanRequest.find({})
    ]);

    // User statistics
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const expiredUsers = allUsers.filter(u => u.status === 'expired').length;
    const freeTrialUsers = allUsers.filter(u => !u.planId || u.planName === 'Free Trial').length;
    const planBoughtUsers = allUsers.filter(u => u.planId && u.planName !== 'Free Trial').length;

    // Repair statistics
    const completedRepairs = allRepairs.filter(r => ['completed', 'delivered'].includes(r.status?.toLowerCase())).length;
    const pendingRepairs = allRepairs.filter(r => r.status?.toLowerCase() === 'pending').length;

    // Sales statistics
    const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    // Complaint statistics
    const pendingComplaints = allComplaints.filter(c => c.status === 'pending').length;
    const completedComplaints = allComplaints.filter(c => c.status === 'resolved').length;

    // Transaction statistics
    const successfulTransactions = allTransactions.filter(t => t.status === 'completed');
    const dailyRevenue = successfulTransactions
      .filter(t => {
        const today = new Date();
        const txDate = new Date(t.createdAt);
        return txDate.toDateString() === today.toDateString();
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const refundRate = allTransactions.length > 0 
      ? ((allTransactions.filter(t => t.status === 'refunded').length / allTransactions.length) * 100).toFixed(2)
      : 0;

    res.json({
      users: {
        total: allUsers.length,
        active: activeUsers,
        expired: expiredUsers,
        freeTrial: freeTrialUsers,
        planBought: planBoughtUsers
      },
      repairs: {
        total: allRepairs.length,
        completed: completedRepairs,
        pending: pendingRepairs
      },
      sales: {
        total: allSales.length,
        totalRevenue
      },
      inventory: {
        total: allInventory.length
      },
      teams: {
        total: allTeams.length
      },
      complaints: {
        total: allComplaints.length,
        pending: pendingComplaints,
        completed: completedComplaints
      },
      transactions: {
        total: allTransactions.length,
        dailyRevenue,
        refundRate,
        activeTopups: allTransactions.filter(t => t.transactionType === 'wallet_topup' && t.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Admin Aggregation Error:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all repairs (admin only)
router.get('/repairs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const repairs = await Repair.find({}).sort({ createdAt: -1 });
    res.json(repairs);
  } catch (error) {
    console.error('Get Repairs Error:', error);
    res.status(500).json({ message: 'Error fetching repairs' });
  }
});

// Get all sales (admin only)
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Get Sales Error:', error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

// Get all inventory (admin only)
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const inventory = await Inventory.find({}).sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    console.error('Get Inventory Error:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// Get all complaints (admin only)
router.get('/complaints', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const complaints = await Complaint.find({}).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('Get Complaints Error:', error);
    res.status(500).json({ message: 'Error fetching complaints' });
  }
});

// Get all transactions (admin only)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const transactions = await Transaction.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Toggle user status (admin only)
router.patch('/users/:userId/toggle-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.is_disabled = !user.is_disabled;
    await user.save();
    res.json({ message: 'User status updated', isDisabled: user.is_disabled });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
