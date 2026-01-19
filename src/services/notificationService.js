const prisma = require('../config/database');
const { NOTIFICATION_TYPES, PRIORITY_LEVELS } = require('../config/constants');

/**
 * NotificationService - Manages system notifications
 * Handles notification creation, delivery, and SLA monitoring
 */
class NotificationService {
  constructor() {
    // Priority-based notification channels
    this.notificationChannels = {
      emergency: ['email', 'in_app'],
      high: ['email', 'in_app'],
      medium: ['in_app'],
      low: ['in_app']
    };

    // SLA requirements in hours
    this.prioritySLA = {
      emergency: 2,   // 2 hours
      high: 24,       // 24 hours
      medium: 72,     // 72 hours (3 days)
      low: 168        // 168 hours (7 days)
    };
  }

  /**
   * Create a notification for a user
   * @param {object} notificationData - Notification data
   * @returns {Promise<object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const {
        user_id,
        report_id = null,
        type = NOTIFICATION_TYPES.INFO,
        title,
        message,
        data = null
      } = notificationData;

      // Validate required fields
      if (!user_id || !title || !message) {
        throw new Error('User ID, title, and message are required');
      }

      // Validate notification type
      if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          user_id,
          report_id,
          type,
          title,
          message,
          data,
          read: false
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              full_name: true,
              role: true
            }
          },
          report: report_id ? {
            select: {
              id: true,
              ticket_id: true,
              status: true,
              priority: true
            }
          } : false
        }
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create priority-based notifications for report events
   * @param {object} report - Report object
   * @param {string} eventType - Event type (created, approved, assigned, completed, etc.)
   * @param {object} additionalData - Additional notification data
   * @returns {Promise<array>} Created notifications
   */
  async createReportNotification(report, eventType, additionalData = {}) {
    try {
      const notifications = [];
      let notificationData = this.getNotificationDataForEvent(report, eventType, additionalData);

      if (!notificationData) {
        return notifications;
      }

      // Determine recipients based on event type and report priority
      const recipients = await this.getNotificationRecipients(report, eventType);

      // Create notifications for each recipient
      for (const recipient of recipients) {
        const notification = await this.createNotification({
          user_id: recipient.id,
          report_id: report.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message.replace('{user_name}', recipient.full_name),
          data: {
            ...notificationData.data,
            channels: this.getNotificationChannels(report.priority),
            ...additionalData
          }
        });

        notifications.push(notification);

        // Send email notifications for high priority reports
        if (this.shouldSendEmail(report.priority)) {
          await this.sendEmailNotification(recipient, notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating report notification:', error);
      return [];
    }
  }

  /**
   * Get notification data for specific report events
   * @param {object} report - Report object
   * @param {string} eventType - Event type
   * @param {object} additionalData - Additional data
   * @returns {object|null} Notification data
   */
  getNotificationDataForEvent(report, eventType, additionalData = {}) {
    const eventTemplates = {
      created: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'New Report Submitted',
        message: `A new ${report.priority || 'medium'} priority report has been submitted: ${report.ticket_id}`,
        data: { event: 'report_created' }
      },
      approved: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Report Approved',
        message: `Your report ${report.ticket_id} has been approved and will be assigned to a maintenance team.`,
        data: { event: 'report_approved' }
      },
      rejected: {
        type: NOTIFICATION_TYPES.WARNING,
        title: 'Report Rejected',
        message: `Your report ${report.ticket_id} has been rejected. ${additionalData.rejection_reason ? 'Reason: ' + additionalData.rejection_reason : ''}`,
        data: { event: 'report_rejected' }
      },
      assigned: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Report Assigned',
        message: `Report ${report.ticket_id} has been assigned to you for maintenance.`,
        data: { event: 'report_assigned' }
      },
      in_progress: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Work Started',
        message: `Work has started on your report ${report.ticket_id}.`,
        data: { event: 'work_started' }
      },
      completed: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Work Completed',
        message: `Work on your report ${report.ticket_id} has been completed. Please rate the service.`,
        data: { event: 'work_completed' }
      },
      closed: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Report Closed',
        message: `Your report ${report.ticket_id} has been closed.`,
        data: { event: 'report_closed' }
      },
      reopened: {
        type: NOTIFICATION_TYPES.WARNING,
        title: 'Report Reopened',
        message: `Report ${report.ticket_id} has been reopened for additional work.`,
        data: { event: 'report_reopened' }
      },
      sla_violation: {
        type: NOTIFICATION_TYPES.ALERT,
        title: 'SLA Violation Alert',
        message: `Report ${report.ticket_id} has exceeded SLA requirements (Priority: ${report.priority}).`,
        data: { event: 'sla_violation' }
      }
    };

    return eventTemplates[eventType] || null;
  }

  /**
   * Get notification recipients based on report and event type
   * @param {object} report - Report object
   * @param {string} eventType - Event type
   * @returns {Promise<array>} Array of recipient users
   */
  async getNotificationRecipients(report, eventType) {
    try {
      const recipients = [];

      switch (eventType) {
        case 'created':
          // Notify coordinators responsible for the block/location
          if (report.location_type === 'specific' && report.block_id) {
            const coordinators = await prisma.coordinatorAssignment.findMany({
              where: { block_id: report.block_id },
              include: { coordinator: true }
            });
            recipients.push(...coordinators.map(c => c.coordinator));
          } else {
            // General location - notify coordinators with general assignment
            const generalCoordinators = await prisma.coordinatorAssignment.findMany({
              where: { block_id: null },
              include: { coordinator: true }
            });
            recipients.push(...generalCoordinators.map(c => c.coordinator));
          }
          break;

        case 'approved':
        case 'rejected':
        case 'in_progress':
        case 'completed':
        case 'closed':
        case 'reopened':
          // Notify the reporter
          const reporter = await prisma.user.findUnique({
            where: { id: report.submitted_by }
          });
          if (reporter) recipients.push(reporter);
          break;

        case 'assigned':
          // Notify the assigned fixer
          if (report.assigned_to) {
            const assignee = await prisma.user.findUnique({
              where: { id: report.assigned_to }
            });
            if (assignee) recipients.push(assignee);
          }
          break;

        case 'sla_violation':
          // Notify coordinators and admins
          const coordinators = await this.getReportCoordinators(report);
          const admins = await prisma.user.findMany({
            where: { role: 'admin', is_active: true }
          });
          recipients.push(...coordinators, ...admins);
          break;
      }

      // Remove duplicates and inactive users
      const uniqueRecipients = recipients.filter((user, index, self) => 
        user.is_active && self.findIndex(u => u.id === user.id) === index
      );

      return uniqueRecipients;
    } catch (error) {
      console.error('Error getting notification recipients:', error);
      return [];
    }
  }

  /**
   * Get coordinators responsible for a report
   * @param {object} report - Report object
   * @returns {Promise<array>} Array of coordinator users
   */
  async getReportCoordinators(report) {
    try {
      let coordinatorAssignments = [];

      if (report.location_type === 'specific' && report.block_id) {
        coordinatorAssignments = await prisma.coordinatorAssignment.findMany({
          where: { block_id: report.block_id },
          include: { coordinator: true }
        });
      } else {
        coordinatorAssignments = await prisma.coordinatorAssignment.findMany({
          where: { block_id: null },
          include: { coordinator: true }
        });
      }

      return coordinatorAssignments.map(c => c.coordinator).filter(c => c.is_active);
    } catch (error) {
      console.error('Error getting report coordinators:', error);
      return [];
    }
  }

  /**
   * Get notification channels for a priority level
   * @param {string} priority - Priority level
   * @returns {array} Array of notification channels
   */
  getNotificationChannels(priority) {
    return this.notificationChannels[priority] || this.notificationChannels.medium;
  }

  /**
   * Check if email notification should be sent for priority level
   * @param {string} priority - Priority level
   * @returns {boolean} Whether to send email
   */
  shouldSendEmail(priority) {
    const channels = this.getNotificationChannels(priority);
    return channels.includes('email');
  }

  /**
   * Send email notification (placeholder for email service integration)
   * @param {object} recipient - Recipient user
   * @param {object} notification - Notification object
   * @returns {Promise<boolean>} Success status
   */
  async sendEmailNotification(recipient, notification) {
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`Email notification sent to ${recipient.email}:`, {
        subject: notification.title,
        message: notification.message,
        priority: notification.data?.priority || 'medium'
      });

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Get notifications for a user with pagination
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Notifications with pagination
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unread_only = false,
        type = null,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      // Build where condition
      const whereCondition = { user_id: userId };
      if (unread_only) whereCondition.read = false;
      if (type) whereCondition.type = type;

      // Get notifications with pagination
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: whereCondition,
          include: {
            report: {
              select: {
                id: true,
                ticket_id: true,
                status: true,
                priority: true
              }
            }
          },
          orderBy: {
            [sort_by]: sort_order
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.notification.count({ where: whereCondition }),
        prisma.notification.count({ 
          where: { user_id: userId, read: false } 
        })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unread_count: unreadCount
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      if (notification.read) {
        return notification; // Already read
      }

      // Mark as read
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
        include: {
          report: {
            select: {
              id: true,
              ticket_id: true,
              status: true,
              priority: true
            }
          }
        }
      });

      return updatedNotification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          user_id: userId,
          read: false
        },
        data: { read: true }
      });

      return result.count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of notifications deleted
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          },
          read: true // Only delete read notifications
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  /**
   * Check for SLA violations and create notifications
   * This is a background job that should be run periodically
   * @returns {Promise<number>} Number of SLA violations found
   */
  async checkSLAViolations() {
    try {
      const reports = await prisma.report.findMany({
        where: {
          priority: { not: null },
          status: { 
            notIn: ['completed', 'closed'] 
          }
        },
        include: {
          submitter: true,
          block: true
        }
      });

      let violationsFound = 0;
      const now = new Date();

      for (const report of reports) {
        const slaHours = this.prioritySLA[report.priority];
        const hoursElapsed = (now - new Date(report.created_at)) / (1000 * 60 * 60);

        if (hoursElapsed > slaHours) {
          // Check if we already notified about this violation recently
          const recentViolationNotification = await prisma.notification.findFirst({
            where: {
              report_id: report.id,
              type: NOTIFICATION_TYPES.ALERT,
              created_at: {
                gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) // Last 4 hours
              }
            }
          });

          if (!recentViolationNotification) {
            await this.createReportNotification(report, 'sla_violation', {
              violation_hours: Math.round(hoursElapsed - slaHours),
              sla_hours: slaHours
            });
            violationsFound++;
          }
        }
      }

      return violationsFound;
    } catch (error) {
      console.error('Error checking SLA violations:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics for analytics
   * @param {object} filters - Filter options
   * @returns {Promise<object>} Notification statistics
   */
  async getNotificationStatistics(filters = {}) {
    try {
      const { start_date, end_date, user_id, type } = filters;

      let whereCondition = {};
      
      if (start_date || end_date) {
        whereCondition.created_at = {};
        if (start_date) whereCondition.created_at.gte = new Date(start_date);
        if (end_date) whereCondition.created_at.lte = new Date(end_date);
      }
      
      if (user_id) whereCondition.user_id = user_id;
      if (type) whereCondition.type = type;

      const [typeCounts, readStats, totalCount] = await Promise.all([
        // Notification type distribution
        prisma.notification.groupBy({
          by: ['type'],
          where: whereCondition,
          _count: true
        }),

        // Read/unread statistics
        prisma.notification.groupBy({
          by: ['read'],
          where: whereCondition,
          _count: true
        }),

        // Total count
        prisma.notification.count({ where: whereCondition })
      ]);

      return {
        type_distribution: typeCounts.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {}),
        read_statistics: readStats.reduce((acc, item) => {
          acc[item.read ? 'read' : 'unread'] = item._count;
          return acc;
        }, {}),
        total_notifications: totalCount
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new NotificationService();