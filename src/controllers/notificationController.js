const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/response');
const Joi = require('joi');

/**
 * NotificationController - Handles notification-related HTTP requests
 */
class NotificationController {
  /**
   * Get user notifications with pagination and filtering
   * GET /notifications
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId; // Use userId from JWT token

      // Validate query parameters
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        unread_only: Joi.boolean().default(false),
        type: Joi.string().valid('info', 'warning', 'alert').optional(),
        sort_by: Joi.string().valid('created_at', 'read').default('created_at'),
        sort_order: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value: queryParams } = schema.validate(req.query);
      if (error) {
        return res.status(400).json(errorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          {
            details: error.details
          }
        ));
      }

      // Get notifications
      const result = await notificationService.getUserNotifications(userId, queryParams);

      return res.status(200).json(successResponse(
        'Notifications retrieved successfully',
        {
          notifications: result.notifications,
          pagination: result.pagination,
          unread_count: result.unread_count
        }
      ));

    } catch (error) {
      console.error('Error getting user notifications:', error);
      return res.status(500).json(errorResponse(
        'Failed to retrieve notifications',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Mark notification as read
   * POST /notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId; // Use userId from JWT token
      const notificationId = req.params.id;

      // Validate notification ID
      if (!notificationId) {
        return res.status(400).json(errorResponse(
          'Notification ID is required',
          'VALIDATION_ERROR'
        ));
      }

      // Mark notification as read
      const notification = await notificationService.markAsRead(notificationId, userId);

      return res.status(200).json(successResponse(
        'Notification marked as read',
        {
          notification
        }
      ));

    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      if (error.message === 'Notification not found or access denied') {
        return res.status(404).json(errorResponse(
          error.message,
          'NOTIFICATION_NOT_FOUND'
        ));
      }

      return res.status(500).json(errorResponse(
        'Failed to mark notification as read',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Mark all notifications as read for the user
   * POST /notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId; // Use userId from JWT token

      // Mark all notifications as read
      const count = await notificationService.markAllAsRead(userId);

      return res.status(200).json(successResponse(
        `${count} notifications marked as read`,
        {
          marked_count: count
        }
      ));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json(errorResponse(
        'Failed to mark notifications as read',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Get notification statistics (admin only)
   * GET /notifications/statistics
   */
  async getNotificationStatistics(req, res) {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json(errorResponse(
          'Access denied. Admin role required.',
          'ACCESS_DENIED'
        ));
      }

      // Validate query parameters
      const schema = Joi.object({
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().optional(),
        user_id: Joi.string().optional(),
        type: Joi.string().valid('info', 'warning', 'alert').optional()
      });

      const { error, value: queryParams } = schema.validate(req.query);
      if (error) {
        return res.status(400).json(errorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          {
            details: error.details
          }
        ));
      }

      // Get statistics
      const statistics = await notificationService.getNotificationStatistics(queryParams);

      return res.status(200).json(successResponse(
        'Notification statistics retrieved successfully',
        statistics
      ));

    } catch (error) {
      console.error('Error getting notification statistics:', error);
      return res.status(500).json(errorResponse(
        'Failed to retrieve notification statistics',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Trigger SLA violation check (admin only)
   * POST /notifications/check-sla
   */
  async checkSLAViolations(req, res) {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json(errorResponse(
          'Access denied. Admin role required.',
          'ACCESS_DENIED'
        ));
      }

      // Run SLA violation check
      const violationsFound = await notificationService.checkSLAViolations();

      return res.status(200).json(successResponse(
        `SLA check completed. ${violationsFound} violations found.`,
        {
          violations_found: violationsFound
        }
      ));

    } catch (error) {
      console.error('Error checking SLA violations:', error);
      return res.status(500).json(errorResponse(
        'Failed to check SLA violations',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Clean up old notifications (admin only)
   * DELETE /notifications/cleanup
   */
  async cleanupOldNotifications(req, res) {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json(errorResponse(
          'Access denied. Admin role required.',
          'ACCESS_DENIED'
        ));
      }

      // Validate query parameters
      const schema = Joi.object({
        days_old: Joi.number().integer().min(1).max(365).default(30)
      });

      const { error, value: queryParams } = schema.validate(req.query);
      if (error) {
        return res.status(400).json(errorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          {
            details: error.details
          }
        ));
      }

      // Clean up old notifications
      const deletedCount = await notificationService.deleteOldNotifications(queryParams.days_old);

      return res.status(200).json(successResponse(
        `${deletedCount} old notifications deleted`,
        {
          deleted_count: deletedCount
        }
      ));

    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return res.status(500).json(errorResponse(
        'Failed to cleanup notifications',
        'NOTIFICATION_ERROR'
      ));
    }
  }

  /**
   * Create a test notification (development/admin only)
   * POST /notifications/test
   */
  async createTestNotification(req, res) {
    try {
      // Check admin permission or development environment
      if (req.user.role !== 'admin' && process.env.NODE_ENV === 'production') {
        return res.status(403).json(errorResponse(
          'Access denied. Admin role required.',
          'ACCESS_DENIED'
        ));
      }

      // Validate request body
      const schema = Joi.object({
        type: Joi.string().valid('info', 'warning', 'alert').default('info'),
        title: Joi.string().min(1).max(100).required(),
        message: Joi.string().min(1).max(500).required(),
        data: Joi.object().optional()
      });

      const { error, value: notificationData } = schema.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(
          'Invalid notification data',
          'VALIDATION_ERROR',
          {
            details: error.details
          }
        ));
      }

      // Create test notification for the current user
      const notification = await notificationService.createNotification({
        user_id: req.user.userId, // Use userId from JWT token
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      });

      return res.status(200).json(successResponse(
        'Test notification created successfully',
        {
          notification
        }
      ));

    } catch (error) {
      console.error('Error creating test notification:', error);
      return res.status(500).json(errorResponse(
        'Failed to create test notification',
        'NOTIFICATION_ERROR'
      ));
    }
  }
}

module.exports = new NotificationController();