const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const TeamMember = require('../models/TeamMember');
const Plan = require('../models/Plan');
const { authenticateToken } = require('../middleware/auth');

router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const [
      repairs,
      stock,
      sales,
      brands,
      categories,
      userTeam,
      plans
    ] = await Promise.all([
      Repair.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      Inventory.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      Sale.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      Brand.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      Category.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      TeamMember.find({ ownerId }).sort({ createdAt: -1 }).limit(10),
      Plan.find({})
    ]);

    // Counts for stat boxes
    const [
      repairCount,
      stockCount,
      salesCount,
      teamCount,
      pendingRepairs,
      completedRepairs
    ] = await Promise.all([
      Repair.countDocuments({ ownerId }),
      Inventory.countDocuments({ ownerId }),
      Sale.countDocuments({ ownerId }),
      TeamMember.countDocuments({ ownerId }),
      Repair.countDocuments({ ownerId, status: 'pending' }),
      Repair.countDocuments({ ownerId, status: { $in: ['completed', 'delivered'] } })
    ]);

    res.json({
      repairs,
      stock,
      sales,
      brands,
      categories,
      userTeam,
      repairCount,
      stockCount,
      salesCount,
      teamCount,
      pendingRepairs,
      completedRepairs,
      plans
    });
  } catch (error) {
    console.error('Dashboard Overview Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
