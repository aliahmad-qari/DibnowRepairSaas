const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
require('dotenv').config();

// Log environment for debugging
console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`[ENV] PORT: ${process.env.PORT || 'not set'}`);

// Import routes
const repairRoutes = require('./routes/repairs');
const userRoutes = require('./routes/users');
const stripeRoutes = require('./routes/stripe');
const payfastRoutes = require('./routes/payfast');
const paypalRoutes = require('./routes/paypal');
const walletRoutes = require('./routes/wallet');
const adminPaymentRoutes = require('./routes/adminPayments');
const publicRoutes = require('./routes/public');
const plansRoutes = require('./routes/plans');
const locationRoutes = require('./routes/location');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const brandsRoutes = require('./routes/brands');
const categoriesRoutes = require('./routes/categories');
const teamRoutes = require('./routes/team');
const dashboardRoutes = require('./routes/dashboard');
const adminDashboardRoutes = require('./routes/adminDashboard');
const clientRoutes = require('./routes/clients');
const complaintRoutes = require('./routes/complaints');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const planRequestsRoutes = require('./routes/planRequests');

// Import services
const { startRenewalScheduler } = require('./services/renewalService');

// Import security middleware
const { publicLimiter, securityHeaders } = require('./middleware/security');
const checkPlanExpiry = require('./middleware/checkPlanExpiry');

const app = express();

// ==================== CORS CONFIGURATION ====================

console.log('[CORS] Configuring CORS...');
console.log('[CORS] NODE_ENV:', process.env.NODE_ENV);

// Dynamic CORS origins from environment
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Alternative port
  'http://localhost:5175',  // Alternative port
  'http://localhost:5176',  // Alternative port
  'http://localhost:5177',  // Alternative port
  'http://localhost:3000',  // Alternative React dev server
  'https://dibnow-repair-saas.vercel.app',  // Production frontend
  'https://dibnowrepairsaas.onrender.com',  // This backend
  process.env.FRONTEND_URL,  // Dynamic frontend URL
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : [])    // Custom CORS origins
].filter(Boolean);  // Remove undefined values

console.log('[CORS] Allowed origins:', allowedOrigins);

// CORS middleware - VERY PERMISSIVE FOR LOCAL DEVELOPMENT
app.use(cors({
  origin: function (origin, callback) {
    console.log('[CORS] Incoming request from origin:', origin);
    console.log('[CORS] NODE_ENV check:', process.env.NODE_ENV);
    
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      console.log(`[CORS] ✅ Allowing request with no origin`);
      return callback(null, true);
    }
    
    // ALWAYS allow localhost in any mode for local testing
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log(`[CORS] ✅ Allowing localhost origin: ${origin}`);
      return callback(null, true);
    }
    
    // In development mode, allow ALL origins
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CORS] ✅ Allowing development origin: ${origin}`);
      return callback(null, true);
    }
    
    // In production, check whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] ✅ Allowing whitelisted origin: ${origin}`);
      return callback(null, true);
    }
    
    console.warn(`[CORS] ❌ Rejected origin: ${origin}`);
    callback(new Error(`Not allowed by CORS policy for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'Link'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize data against XSS
app.use(xss());

// Security headers
app.use(securityHeaders);

// Check plan expiry on every authenticated request
app.use(checkPlanExpiry);

// Apply rate limiter ONLY to public routes (not authenticated CRUD)
app.use('/api/users/login', publicLimiter);
app.use('/api/users/register', publicLimiter);
app.use('/api/users/forgot-password', publicLimiter);
app.use('/api/public', publicLimiter);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ==================== ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    nodeEnv: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/repairs', repairRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/payfast', payfastRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plan-requests', planRequestsRoutes);

// Root endpoint
app.get('/', (req, res) => res.send("DibNow API is Running..."));

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS not allowed for this origin'
    });
  }

  // Handle mongoose errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate entry'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// ==================== DATABASE CONNECTION ====================

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ DB Connection Error: MONGODB_URI not found in environment");
      console.log("Available env vars:", Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB')));
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    console.log("Attempting MongoDB connection...");
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  await connectDB();
  
  // Start renewal scheduler
  startRenewalScheduler();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security headers: ENABLED`);
    console.log(`⚡ Rate limiting: ENABLED`);
    console.log(`🔄 Auto-renewal scheduler: STARTED`);
  });
};

startServer();

module.exports = app;
