const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const checkLimits = require('../middleware/checkLimits');
const { checkUserStatus } = require('../middleware/permissions');

// Apply user status check to all routes
router.use(authenticateToken, checkUserStatus);

// Get team members
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    console.error('[TEAM] Error fetching team:', error);
    res.status(500).json({ message: 'Error fetching team' });
  }
});

// Add team member
router.post('/', checkLimits('teamMembers'), async (req, res) => {
  try {
    const { name, email, phone, password, role, department, permissions } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, password, and role are required' 
      });
    }
    
    // Check for duplicate email in both TeamMember and User collections
    const [existingMember, existingUser] = await Promise.all([
      TeamMember.findOne({ email: email.toLowerCase(), ownerId: req.user.userId }),
      User.findOne({ email: email.toLowerCase() })
    ]);
    
    if (existingMember) {
      return res.status(400).json({ 
        message: 'A team member with this email already exists' 
      });
    }
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'A user with this email already exists' 
      });
    }
    
    // Create User account for team member
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user', // Team members are regular users
      status: 'active',
      permissions: permissions || [],
      phone,
      emailVerified: true // Auto-verify team member accounts
    });
    
    await newUser.save();
    
    // Create TeamMember record for management
    const newMember = new TeamMember({
      name,
      email: email.toLowerCase(),
      phone,
      role,
      department: department || 'General',
      status: 'active',
      permissions: permissions || [],
      ownerId: req.user.userId,
      userId: newUser._id
    });
    
    await newMember.save();
    console.log(`[TEAM] Created team member: ${email} for owner: ${req.user.userId}`);
    res.status(201).json(newMember);
  } catch (error) {
    console.error('[TEAM] Error creating team member:', error);
    res.status(500).json({ 
      message: 'Error creating team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update team member
router.put('/:id', async (req, res) => {
  try {
    const { status, permissions } = req.body;
    
    const member = await TeamMember.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.userId 
    });
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Update TeamMember record
    const updated = await TeamMember.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );
    
    // If updating status or permissions, also update the User record
    if (member.userId && (status !== undefined || permissions !== undefined)) {
      const userUpdate = {};
      if (status !== undefined) userUpdate.status = status;
      if (permissions !== undefined) userUpdate.permissions = permissions;
      
      await User.findByIdAndUpdate(member.userId, userUpdate);
    }
    
    res.json(updated);
  } catch (error) {
    console.error('[TEAM] Error updating member:', error);
    res.status(500).json({ message: 'Error updating member' });
  }
});

module.exports = router;
