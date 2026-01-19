const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, analyticsSchemas, paramSchemas } = require('../middleware/validation');

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route GET /analytics
 * @desc Get system analytics with optional filtering
 * @access Coordinator, Admin
 * @query {number} block_id - Block ID for filtering (1-100)
 * @query {string} period - Time period (day/week/month/quarter/year)
 * @query {string} metric - Metric type (completion_rate/avg_time/rating/duplicate_rate)
 */
router.get('/', 
  authorize(['coordinator', 'admin']),
  validate(analyticsSchemas.getAnalyticsQuery, 'query'),
  analyticsController.getAnalytics
);

/**
 * @route GET /analytics/blocks/:block_id/performance
 * @desc Get performance analytics for a specific block
 * @access Authenticated users
 * @param {number} block_id - Block ID (1-100)
 * @query {string} start_date - Start date for filtering (ISO 8601)
 * @query {string} end_date - End date for filtering (ISO 8601)
 */
router.get('/blocks/:block_id/performance', 
  validate(paramSchemas.blockNumber, 'params'), // Reuse blockNumber schema for block_id
  validate(analyticsSchemas.blockPerformanceQuery, 'query'),
  analyticsController.getBlockPerformance
);

/**
 * @route GET /analytics/users/:user_id/performance
 * @desc Get performance analytics for a specific user
 * @access Admin and Coordinator only
 * @param {string} user_id - User ID
 * @query {string} start_date - Start date for filtering (ISO 8601)
 * @query {string} end_date - End date for filtering (ISO 8601)
 */
router.get('/users/:user_id/performance', 
  authorize(['admin', 'coordinator']),
  validate(paramSchemas.userId, 'params'),
  validate(analyticsSchemas.userPerformanceQuery, 'query'),
  analyticsController.getUserPerformance
);

/**
 * @route GET /analytics/system/status
 * @desc Get real-time system status and health metrics
 * @access Admin only
 */
router.get('/system/status', 
  authorize('admin'),
  analyticsController.getSystemStatus
);

module.exports = router;