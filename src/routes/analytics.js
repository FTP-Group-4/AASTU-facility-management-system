const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

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
router.get('/', analyticsController.getAnalytics);

/**
 * @route GET /analytics/blocks/:block_id/performance
 * @desc Get performance analytics for a specific block
 * @access Authenticated users
 * @param {number} block_id - Block ID (1-100)
 * @query {string} start_date - Start date for filtering (ISO 8601)
 * @query {string} end_date - End date for filtering (ISO 8601)
 */
router.get('/blocks/:block_id/performance', analyticsController.getBlockPerformance);

/**
 * @route GET /analytics/users/:user_id/performance
 * @desc Get performance analytics for a specific user
 * @access Admin and Coordinator only
 * @param {string} user_id - User ID
 * @query {string} start_date - Start date for filtering (ISO 8601)
 * @query {string} end_date - End date for filtering (ISO 8601)
 */
router.get('/users/:user_id/performance', analyticsController.getUserPerformance);

/**
 * @route GET /analytics/system/status
 * @desc Get real-time system status and health metrics
 * @access Admin only
 */
router.get('/system/status', analyticsController.getSystemStatus);

module.exports = router;