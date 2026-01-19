const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, notificationSchemas, paramSchemas } = require('../middleware/validation');

/**
 * @route GET /notifications
 * @desc Get user notifications with pagination and filtering
 * @access Private (All authenticated users)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {boolean} unread_only - Show only unread notifications (default: false)
 * @query {string} type - Filter by notification type (info, warning, alert)
 * @query {string} sort_by - Sort field (created_at, read) (default: created_at)
 * @query {string} sort_order - Sort order (asc, desc) (default: desc)
 */
router.get('/', 
  validate(notificationSchemas.getUserNotificationsQuery, 'query'),
  authenticate,
  notificationController.getUserNotifications
);

// Apply authentication middleware to remaining routes
router.use(authenticate);

/**
 * @route POST /notifications/:id/read
 * @desc Mark a specific notification as read
 * @access Private (Notification owner only)
 * @param {string} id - Notification ID
 */
router.post('/:id/read', 
  validate(paramSchemas.userId, 'params'), // Reuse userId schema for notification ID
  notificationController.markAsRead
);

/**
 * @route POST /notifications/read-all
 * @desc Mark all user notifications as read
 * @access Private (All authenticated users)
 */
router.post('/read-all', notificationController.markAllAsRead);

/**
 * @route GET /notifications/statistics
 * @desc Get notification statistics
 * @access Private (Admin only)
 * @query {string} start_date - Start date filter (ISO format)
 * @query {string} end_date - End date filter (ISO format)
 * @query {string} user_id - Filter by user ID
 * @query {string} type - Filter by notification type
 */
router.get('/statistics', 
  authorize('admin'),
  validate(notificationSchemas.notificationStatisticsQuery, 'query'),
  notificationController.getNotificationStatistics
);

/**
 * @route POST /notifications/check-sla
 * @desc Trigger SLA violation check
 * @access Private (Admin only)
 */
router.post('/check-sla', 
  authorize('admin'),
  notificationController.checkSLAViolations
);

/**
 * @route DELETE /notifications/cleanup
 * @desc Clean up old notifications
 * @access Private (Admin only)
 * @query {number} days_old - Delete notifications older than this many days (default: 30)
 */
router.delete('/cleanup', 
  authorize('admin'),
  validate(notificationSchemas.cleanupNotifications, 'query'),
  notificationController.cleanupOldNotifications
);

/**
 * @route POST /notifications/test
 * @desc Create a test notification (development/admin only)
 * @access Private (Admin only or development environment)
 * @body {string} type - Notification type (info, warning, alert)
 * @body {string} title - Notification title
 * @body {string} message - Notification message
 * @body {object} data - Additional notification data (optional)
 */
router.post('/test', 
  authorize('admin'),
  validate(notificationSchemas.createTestNotification),
  notificationController.createTestNotification
);

module.exports = router;