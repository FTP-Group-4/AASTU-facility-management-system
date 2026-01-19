const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const scheduler = require('./utils/scheduler');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error_code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/blocks', blockRoutes);
app.use('/admin', adminRoutes);
app.use('/coordinator', coordinatorRoutes);
app.use('/coordinators', coordinatorRoutes); // Also mount under plural form for compatibility
app.use('/fixer', fixerRoutes);
app.use('/uploads', uploadRoutes);
app.use('/reports', reportRoutes);
app.use('/notifications', notificationRoutes);

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
        'POST /notifications/test - Create test notification (admin/dev)'
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