const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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

// API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

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
        'PUT /users/:id - Update user (admin)'
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
  });
}

module.exports = app;