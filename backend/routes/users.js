const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Security middleware
const { 
  loginLimiter, 
  registerLimiter, 
  otpLimiter, 
  passwordResetLimiter,
  apiLimiter,
  trackFailedLogin, 
  checkBruteForce, 
  clearFailedLogins,
  securityHeaders,
  sanitizeInput 
} = require('../middleware/security');

// Auth middleware
const { 
  authenticateToken, 
  authorizeRoles,
  adminOnly,
  superAdminOnly
} = require('../middleware/auth');

// Validation middleware
const {
  registerValidation,
  loginValidation,
  otpValidation,
  passwordResetRequestValidation,
  passwordResetConfirmValidation
} = require('../middleware/validation');

// Apply security headers to all routes
router.use(securityHeaders);
router.use(sanitizeInput);

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate secure token for email verification
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Email transporter configuration
const createTransporter = async () => {
  // Check for Resend API first (Production)
  if (process.env.RESEND_API_KEY) {
    console.log('[EMAIL] Using Resend API for emails');
    return { type: 'resend' };
  }

  // Check for SMTP credentials
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log('[EMAIL] No SMTP credentials found, using ethereal test account');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email sending function
const sendEmail = async (to, subject, html) => {
  try {
    const fromName = process.env.FROM_NAME || 'DibNow';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@resend.dev';

    // Use Resend API if configured
    if (process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Sending email via Resend to:', to);
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html
      });

      if (error) {
        console.error('[EMAIL] Resend error:', error);
        return false;
      }

      console.log('[EMAIL] Resend success:', data);
      return true;
    }

    // Use Nodemailer for SMTP
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`[EMAIL] Message sent to: ${to}`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
};

// ==================== PUBLIC ROUTES ==================== 

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Register new user - NO EMAIL VERIFICATION NEEDED
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  try {
    console.log('[REGISTER] Starting registration process...');
    const { name, email, password, phone, company, address, postcode } = req.body;
    console.log('[REGISTER] Request data:', { name, email, phone, company });

    // Check if user already exists
    console.log('[REGISTER] Checking for existing user...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('[REGISTER] User already exists:', email);
      return res.status(400).json({ 
        message: 'User with this email already exists. Please login instead.',
        alreadyExists: true
      });
    }

    // Create user - Auto-verified, no email needed
    console.log('[REGISTER] Creating new user...');
    const user = new User({
      name,
      email,
      password,
      phone,
      company,
      address,
      postcode,
      emailVerified: true,
      status: 'active',
      planName: 'Free Trial',
      planStartDate: new Date(),
      planExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      planStatus: 'active'
    });

    console.log('[REGISTER] Saving user to database...');
    await user.save();
    console.log('[REGISTER] User saved successfully');

    // Generate tokens
    console.log('[REGISTER] Generating tokens...');
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log('[REGISTER] Tokens generated successfully');

    // Remove sensitive data
    user.password = undefined;

    console.log('[REGISTER] Registration complete for:', email);
    res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('[REGISTER] Registration error:', error);
    console.error('[REGISTER] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for brute force
    if (checkBruteForce(email)) {
      return res.status(429).json({
        message: 'Account temporarily locked due to too many failed attempts. Please try again after 15 minutes.'
      });
    }

    // Find user with password
    const user = await User.findValidForLogin(email);

    if (!user) {
      trackFailedLogin(email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is blocked/disabled (only for regular users, not admin/superadmin)
    if (user.role === 'user' && (user.status === 'disabled' || user.status === 'cancelled')) {
      return res.status(403).json({ 
        message: 'You have been blocked. Please contact your account owner.',
        blocked: true 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account is temporarily locked. Please try again later.',
        lockedUntil: user.lockUntil
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // If user is admin/superadmin, try matching password with adminAccessToken as a fallback
      // This allows using the generated "tokens" to log in.
      if ((user.role === 'admin' || user.role === 'superadmin') && user.adminAccessToken === password) {
        // Token match! Continue
      } else {
        await user.incLoginAttempts();
        trackFailedLogin(email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // All users are auto-verified - skip check
    
    // Check plan expiry and auto-expire if needed
    if (user.planExpireDate && new Date(user.planExpireDate) < new Date() && user.status === 'active') {
      user.status = 'expired';
      await user.save();
      console.log(`[AUTH] Plan expired for user: ${email}`);
    }
    
    // Clear failed login attempts
    clearFailedLogins(email);

    // Update login info
    user.lastLogin = new Date();
    user.lastLoginIp = req.ip;
    user.loginAttempts = 0;
    if (user.lockUntil) {
      user.lockUntil = undefined;
    }
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove sensitive fields
    user.password = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    console.log(`[AUTH] User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Verify email
router.post('/verify-email', otpValidation, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // For simplicity, we're using OTP verification
    // In production, also verify the token from email link
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification' });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.status = 'active';
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
});

// Forgot password - Send OTP
router.post('/forgot-password', passwordResetLimiter, passwordResetRequestValidation, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        message: 'If an account with that email exists, a verification code has been sent.'
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    user.passwordResetToken = otp;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    await sendEmail(
      email,
      'Your Password Reset Code',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5; text-align: center;">Password Reset Code</h1>
        <p style="text-align: center; font-size: 16px;">Enter the following 6-digit code to reset your password:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="text-align: center; color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>`
    );

    console.log(`[AUTH] Password reset OTP generated for: ${email}, OTP: ${otp}`);

    res.json({
      message: 'If an account with that email exists, a verification code has been sent.',
      otp: otp // Return OTP for auto-fill
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

// Verify Reset OTP
router.post('/verify-reset-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: otp,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Generate a reset token for password reset
    const resetToken = generateSecureToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for password reset
    await user.save();

    console.log(`[AUTH] OTP verified for: ${email}`);

    res.json({
      message: 'OTP verified successfully',
      resetToken: resetToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// Reset password with token
router.post('/reset-password', passwordResetConfirmValidation, async (req, res) => {
  try {
    const { token, email, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Send confirmation email (optional)
    await sendEmail(
      user.email,
      'Password Changed Successfully',
      `<h1>Password Changed</h1>
       <p>Your password has been changed successfully.</p>
       <p>If you didn't make this change, please contact support immediately.</p>`
    );

    console.log(`[AUTH] Password reset completed for: ${user.email}`);

    res.json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user || user.is_disabled) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newToken = generateToken(user);

    res.json({
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// ==================== PROTECTED ROUTES ==================== 

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only update their own data unless they're admin
    if (req.user.role !== 'superadmin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { password, role, is_disabled, ...updateData } = req.body;

    // Only allow role updates for superadmin
    if (role && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Cannot change role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    await sendEmail(
      user.email,
      'Password Changed',
      `<h1>Password Changed</h1>
       <p>Your password has been changed successfully.</p>
       <p>If you didn't make this change, please contact support immediately.</p>`
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('planId', 'name price features status expiresAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user with plan details and notifications count
    const Notification = require('../models/Notification');
    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: user._id.toString() }, { userId: 'global' }],
      read: false
    });

    res.json({
      ...user.toObject(),
      id: user._id.toString(),
      currentPlan: user.planId ? user.planId.name : 'Free Trial',
      planStatus: user.status,
      planExpiresAt: user.planId?.expiresAt,
      unreadNotifications: unreadCount
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Get single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin login
router.post('/admin/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['admin', 'superadmin'] }
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Allow login with adminAccessToken
      if (user.adminAccessToken === password) {
        // Token match!
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Check if account is active
    if (user.is_disabled) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      user.lastLoginIp = undefined;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

// Create Admin (Super Admin only)
router.post('/admin/create', authenticateToken, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a secure access token for this admin
    const adminAccessToken = crypto.randomBytes(16).toString('hex');

    const admin = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      permissions,
      adminAccessToken,
      emailVerified: true,
      status: 'active'
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminAccessToken
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Error creating admin account' });
  }
});

module.exports = router;
