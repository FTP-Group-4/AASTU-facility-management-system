const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const scheduler = require('./utils/scheduler');
const { 
  sanitizeInput, 
  preventParameterPollution, 
  requestSizeLimit, 
  securityHeaders, 
  securityLogger 
} = require('./middleware/security');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://aastu-facilities.vercel.app' // Add production frontend URL
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error_code: 'RATE_LIMIT_EXCEEDED',
      data: null,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests for some endpoints
    skip: (req, res) => false, // Always apply rate limiting headers
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.userId || req.ip;
    }
  });
};

// General rate limiting
const generalLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests per minute per user/IP
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'test' ? 50 : 5, // Allow more requests in test environment
  'Too many authentication attempts, please try again later.'
);

// File upload rate limiting
const uploadLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  10, // 10 uploads per minute
  'Too many file uploads, please try again later.'
);

// Apply general rate limiting
app.use(generalLimiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(requestSizeLimit);
app.use(securityHeaders);
app.use(securityLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(preventParameterPollution);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AASTU Facilities Management API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blockRoutes = require('./routes/blocks');
const adminRoutes = require('./routes/admin');
const coordinatorRoutes = require('./routes/coordinators');
const fixerRoutes = require('./routes/fixers');
const uploadRoutes = require('./routes/uploads');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// API routes with specific rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/uploads', uploadLimiter, uploadRoutes);
app.use('/users', userRoutes);
app.use('/blocks', blockRoutes);
app.use('/admin', adminRoutes);
app.use('/coordinator', coordinatorRoutes);
app.use('/coordinators', coordinatorRoutes); // Also mount under plural form for compatibility
app.use('/fixer', fixerRoutes);
app.use('/reports', reportRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AASTU Facilities Management API v1.0',
    data: {
      endpoints: [
        'GET /health - Health check',
        'POST /auth/login - User authentication',
        'POST /auth/refresh - Token refresh',
        'POST /auth/logout - User logout',
        'GET /auth/validate - Token validation',
        'GET /users/profile - User profile',
        'PUT /users/profile - Update profile',
        'GET /users - Get all users (admin)',
        'POST /users - Create user (admin)',
        'GET /users/:id - Get user by ID',
        'PUT /users/:id - Update user (admin)',
        'GET /blocks/:number - Get block by number',
        'GET /blocks/:id/coordinators - Get block coordinators',
        'GET /coordinator/dashboard - Coordinator dashboard',
        'POST /coordinator/reports/:id/review - Review report (coordinator)',
        'GET /coordinator/fixers - Get available fixers',
        'GET /coordinator/reports - Get assigned reports',
        'GET /coordinator/reports/pending - Get pending reports',
        'GET /coordinators/:id/blocks - Get coordinator blocks',
        'GET /fixer/dashboard - Fixer dashboard',
        'GET /fixer/queue - Get job queue',
        'POST /fixer/jobs/:id/status - Update job status',
        'GET /admin/blocks - Get all blocks (admin)',
        'GET /admin/blocks/:id - Get block by ID (admin)',
        'POST /admin/blocks - Create block (admin)',
        'PUT /admin/blocks/:id - Update block (admin)',
        'DELETE /admin/blocks/:id - Delete block (admin)',
        'POST /admin/blocks/initialize - Initialize default blocks (admin)',
        'POST /admin/blocks/:id/coordinators - Assign coordinator (admin)',
        'DELETE /admin/blocks/:id/coordinators/:coordinatorId - Remove coordinator (admin)',
        'GET /admin/assignments - Get assignment matrix (admin)',
        'POST /uploads/photos - Upload photos (authenticated)',
        'GET /uploads/photos/:filename - Serve photo file',
        'DELETE /uploads/photos/:filename - Delete photo (admin)',
        'GET /uploads/config - Get upload configuration',
        'POST /reports - Create maintenance report',
        'GET /reports - Get reports with filtering',
        'POST /reports/check-duplicates - Check for duplicate reports',
        'GET /reports/:id - Get report by ID or ticket ID',
        'PUT /reports/:id/status - Update report status',
        'POST /reports/:id/rate - Submit rating and feedback',
        'GET /reports/:id/transitions - Get available transitions',
        'GET /reports/:id/history - Get workflow history',
        'DELETE /reports/:id - Delete report (admin only)',
        'GET /notifications - Get user notifications',
        'POST /notifications/:id/read - Mark notification as read',
        'POST /notifications/read-all - Mark all notifications as read',
        'GET /notifications/statistics - Get notification statistics (admin)',
        'POST /notifications/check-sla - Trigger SLA violation check (admin)',
        'DELETE /notifications/cleanup - Clean up old notifications (admin)',
        'POST /notifications/test - Create test notification (admin/dev)',
        'GET /analytics - Get system analytics with filtering',
        'GET /analytics/blocks/:id/performance - Get block performance metrics',
        'GET /analytics/users/:id/performance - Get user performance metrics (admin/coordinator)',
        'GET /analytics/system/status - Get real-time system status (admin)',
        'GET /admin/dashboard - Get admin dashboard with system health',
        'POST /admin/reports/generate - Generate and download system reports (admin)'
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error_code: 'ENDPOINT_NOT_FOUND',
    data: null
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error_code: err.code || 'INTERNAL_ERROR',
    data: null,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 AASTU Facilities Management API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API info: http://localhost:${PORT}/api`);
    
    // Start background job scheduler
    scheduler.start();
  });
}

module.exports = app;