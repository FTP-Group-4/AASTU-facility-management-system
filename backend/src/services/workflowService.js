const prisma = require('../config/database');
const notificationService = require('./notificationService');
const completionService = require('./completionService');

/**
 * WorkflowService - Manages report workflow state transitions
 * Handles state validation, transitions, and history tracking
 */
class WorkflowService {
  constructor() {
    // Define valid workflow states and their allowed transitions
    this.workflowStates = {
      submitted: {
        allowedTransitions: ['under_review', 'rejected'],
        requiredRoles: ['coordinator', 'admin'],
        actions: {
          under_review: 'review',
          rejected: 'reject'
        }
      },
      under_review: {
        allowedTransitions: ['approved', 'rejected'],
        requiredRoles: ['coordinator', 'admin'],
        actions: {
          approved: 'approve',
          rejected: 'reject'
        }
      },
      approved: {
        allowedTransitions: ['assigned'],
        requiredRoles: ['coordinator', 'admin'],
        actions: {
          assigned: 'assign'
        }
      },
      rejected: {
        allowedTransitions: ['under_review'],
        requiredRoles: ['coordinator', 'admin'],
        actions: {
          under_review: 'reopen'
        }
      },
      assigned: {
        allowedTransitions: ['in_progress'],
        requiredRoles: ['electrical_fixer', 'mechanical_fixer', 'admin'],
        actions: {
          in_progress: 'start_work'
        }
      },
      in_progress: {
        allowedTransitions: ['completed'],
        requiredRoles: ['electrical_fixer', 'mechanical_fixer', 'admin'],
        actions: {
          completed: 'complete'
        }
      },
      completed: {
        allowedTransitions: ['closed', 'reopened', 'under_review'],
        requiredRoles: ['reporter', 'coordinator', 'admin'], // Reporter can rate, coordinator can close
        actions: {
          closed: 'close',
          reopened: 'reopen',
          under_review: 'review_rating'
        }
      },
      closed: {
        allowedTransitions: ['reopened'],
        requiredRoles: ['reporter', 'coordinator', 'admin'],
        actions: {
          reopened: 'reopen'
        }
      },
      reopened: {
        allowedTransitions: ['assigned'],
        requiredRoles: ['coordinator', 'admin'],
        actions: {
          assigned: 'reassign'
        }
      }
    };

    // Priority levels and their SLA requirements (in hours)
    this.prioritySLA = {
      emergency: 2,   // 2 hours
      high: 24,       // 24 hours
      medium: 72,     // 72 hours (3 days)
      low: 168        // 168 hours (7 days)
    };
  }

  /**
   * Validate if a state transition is allowed
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @param {string} userRole - Role of user making the transition
   * @param {string} userId - ID of user making the transition
   * @param {object} report - Report object for additional validation
   * @returns {Promise<object>} Validation result
   */
  async validateTransition(fromStatus, toStatus, userRole, userId, report = null) {
    try {
      // Check if current status exists in workflow
      if (!this.workflowStates[fromStatus]) {
        return {
          valid: false,
          error: `Invalid current status: ${fromStatus}`
        };
      }

      const currentState = this.workflowStates[fromStatus];

      // Check if transition is allowed
      if (!currentState.allowedTransitions.includes(toStatus)) {
        return {
          valid: false,
          error: `Transition from ${fromStatus} to ${toStatus} is not allowed`
        };
      }

      // Check if user role is authorized for this transition
      if (!currentState.requiredRoles.includes(userRole)) {
        return {
          valid: false,
          error: `Role ${userRole} is not authorized to transition from ${fromStatus}`
        };
      }

      // Additional role-specific validations
      if (report) {
        // Reporters can only transition their own reports (for rating/feedback)
        if (userRole === 'reporter' && report.submitted_by !== userId) {
          return {
            valid: false,
            error: 'Reporters can only transition their own reports'
          };
        }

        // Fixers can only work on reports assigned to them or in their category
        if ((userRole === 'electrical_fixer' || userRole === 'mechanical_fixer')) {
          const fixerCategory = userRole === 'electrical_fixer' ? 'electrical' : 'mechanical';
          
          console.log('Fixer validation:', {
            userRole,
            fixerCategory,
            reportCategory: report.category,
            fromStatus,
            reportAssignedTo: report.assigned_to,
            userId,
            userIdType: typeof userId,
            assignedToType: typeof report.assigned_to
          });
          
          if (report.category !== fixerCategory) {
            return {
              valid: false,
              error: `${userRole} can only work on ${fixerCategory} reports`
            };
          }

          // For assigned reports, must be assigned to this fixer
          if (fromStatus === 'assigned' && report.assigned_to && report.assigned_to !== userId) {
            console.log('Assignment mismatch:', {
              reportAssignedTo: report.assigned_to,
              userId,
              equal: report.assigned_to === userId
            });
            return {
              valid: false,
              error: 'Report is assigned to a different fixer'
            };
          }
        }

        // Coordinators can only manage reports in their assigned blocks
        if (userRole === 'coordinator') {
          const hasAccess = await this.validateCoordinatorAccess(userId, report);
          if (!hasAccess) {
            return {
              valid: false,
              error: 'Coordinator does not have access to this report'
            };
          }
        }
      }

      return {
        valid: true,
        action: currentState.actions[toStatus]
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate coordinator access to a report
   * @param {string} coordinatorId - Coordinator user ID
   * @param {object} report - Report object
   * @returns {Promise<boolean>} Access validation result
   */
  async validateCoordinatorAccess(coordinatorId, report) {
    try {
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: coordinatorId }
      });

      // Check if coordinator has general assignment (null block_id)
      const hasGeneralAssignment = assignments.some(a => a.block_id === null);
      
      // Check if coordinator is assigned to the specific block
      const hasBlockAssignment = report.block_id && 
        assignments.some(a => a.block_id === report.block_id);

      // Coordinator has access if:
      // 1. They have general assignment and report is general location
      // 2. They have specific block assignment and report is in that block
      // 3. They have general assignment (can handle "Location Not Specified")
      return (hasGeneralAssignment && report.location_type === 'general') ||
             hasBlockAssignment ||
             hasGeneralAssignment;
    } catch (error) {
      console.error('Error validating coordinator access:', error);
      return false;
    }
  }

  /**
   * Execute a state transition with validation and history tracking
   * @param {string} reportId - Report ID
   * @param {string} toStatus - Target status
   * @param {string} userId - User ID making the transition
   * @param {string} userRole - User role
   * @param {object} transitionData - Additional data for the transition
   * @returns {Promise<object>} Transition result
   */
  async executeTransition(reportId, toStatus, userId, userRole, transitionData = {}) {
    try {
      // Get current report
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          submitter: true,
          assignee: true,
          block: true
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      const fromStatus = report.status;

      // Validate transition
      const validation = await this.validateTransition(fromStatus, toStatus, userRole, userId, report);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Prepare update data
      const updateData = {
        status: toStatus,
        updated_at: new Date()
      };

      // Handle status-specific data updates
      switch (toStatus) {
        case 'approved':
          if (!transitionData.priority) {
            throw new Error('Priority is required when approving a report');
          }
          updateData.priority = transitionData.priority;
          break;

        case 'rejected':
          if (!transitionData.rejection_reason) {
            throw new Error('Rejection reason is required when rejecting a report');
          }
          updateData.rejection_reason = transitionData.rejection_reason;
          break;

        case 'assigned':
          if (!transitionData.assigned_to) {
            throw new Error('Assignee is required when assigning a report');
          }
          updateData.assigned_to = transitionData.assigned_to;
          break;

        case 'completed':
          if (!transitionData.completion_notes) {
            throw new Error('Completion notes are required when completing a report');
          }
          updateData.completion_notes = transitionData.completion_notes;
          updateData.parts_used = transitionData.parts_used || null;
          updateData.time_spent_minutes = transitionData.time_spent_minutes || null;
          
          // Create completion details record
          try {
            await completionService.createCompletionDetails(reportId, userId, {
              completion_notes: transitionData.completion_notes,
              parts_used: transitionData.parts_used,
              time_spent_minutes: transitionData.time_spent_minutes,
              completion_photos: transitionData.completion_photos || []
            });
          } catch (completionError) {
            console.error('Error creating completion details:', completionError);
            // Continue with workflow transition even if completion details fail
          }
          break;

        case 'closed':
          // Closed by rating or coordinator decision
          if (transitionData.rating !== undefined) {
            updateData.rating = transitionData.rating;
            updateData.feedback = transitionData.feedback || null;
          }
          break;
      }

      // Execute the transition in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the report
        const updatedReport = await tx.report.update({
          where: { id: reportId },
          data: updateData,
          include: {
            submitter: {
              select: {
                id: true,
                email: true,
                full_name: true,
                role: true
              }
            },
            assignee: {
              select: {
                id: true,
                email: true,
                full_name: true,
                role: true
              }
            },
            block: {
              select: {
                id: true,
                block_number: true,
                name: true
              }
            }
          }
        });

        // Create workflow history entry
        await tx.workflowHistory.create({
          data: {
            report_id: reportId,
            user_id: userId,
            from_status: fromStatus,
            to_status: toStatus,
            action: validation.action,
            notes: transitionData.notes || null
          }
        });

        return updatedReport;
      });

      // Check for SLA violations after transition
      await this.checkSLAViolation(result);

      // Create notification for the transition
      await this.createTransitionNotification(result, toStatus, fromStatus);

      return {
        success: true,
        report: result,
        transition: {
          from: fromStatus,
          to: toStatus,
          action: validation.action
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create notification for workflow transition
   * @param {object} report - Updated report object
   * @param {string} toStatus - New status
   * @param {string} fromStatus - Previous status
   * @returns {Promise<void>}
   */
  async createTransitionNotification(report, toStatus, fromStatus) {
    try {
      // Map status transitions to notification events
      const eventMapping = {
        'submitted': 'created',
        'under_review': 'under_review',
        'approved': 'approved',
        'rejected': 'rejected',
        'assigned': 'assigned',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'closed': 'closed',
        'reopened': 'reopened'
      };

      const eventType = eventMapping[toStatus];
      if (eventType) {
        await notificationService.createReportNotification(report, eventType, {
          previous_status: fromStatus,
          rejection_reason: report.rejection_reason
        });
      }
    } catch (error) {
      console.error('Error creating transition notification:', error);
      // Don't throw error as this is not critical for workflow execution
    }
  }

  /**
   * Get workflow history for a report
   * @param {string} reportId - Report ID
   * @returns {Promise<array>} Workflow history entries
   */
  async getWorkflowHistory(reportId) {
    try {
      return await prisma.workflowHistory.findMany({
        where: { report_id: reportId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for SLA violations and create notifications
   * @param {object} report - Report object
   * @returns {Promise<void>}
   */
  async checkSLAViolation(report) {
    try {
      if (!report.priority || report.status === 'closed') {
        return; // No SLA check needed
      }

      const slaHours = this.prioritySLA[report.priority];
      const createdAt = new Date(report.created_at);
      const now = new Date();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursElapsed > slaHours) {
        // SLA violation detected - create notification
        await this.createSLAViolationNotification(report, hoursElapsed, slaHours);
      }
    } catch (error) {
      console.error('Error checking SLA violation:', error);
    }
  }

  /**
   * Create SLA violation notification
   * @param {object} report - Report object
   * @param {number} hoursElapsed - Hours elapsed since creation
   * @param {number} slaHours - SLA requirement in hours
   * @returns {Promise<void>}
   */
  async createSLAViolationNotification(report, hoursElapsed, slaHours) {
    try {
      const violationHours = Math.round(hoursElapsed - slaHours);
      
      // Notify coordinators and admins
      const coordinators = await prisma.coordinatorAssignment.findMany({
        where: {
          OR: [
            { block_id: report.block_id },
            { block_id: null } // General assignment
          ]
        },
        include: {
          coordinator: true
        }
      });

      const admins = await prisma.user.findMany({
        where: { role: 'admin', is_active: true }
      });

      const notificationPromises = [];

      // Notify coordinators
      coordinators.forEach(assignment => {
        notificationPromises.push(
          prisma.notification.create({
            data: {
              user_id: assignment.coordinator.id,
              report_id: report.id,
              type: 'alert',
              title: 'SLA Violation Alert',
              message: `Report ${report.ticket_id} has exceeded SLA by ${violationHours} hours (Priority: ${report.priority})`,
              data: {
                violation_hours: violationHours,
                sla_hours: slaHours,
                priority: report.priority
              }
            }
          })
        );
      });

      // Notify admins
      admins.forEach(admin => {
        notificationPromises.push(
          prisma.notification.create({
            data: {
              user_id: admin.id,
              report_id: report.id,
              type: 'alert',
              title: 'SLA Violation Alert',
              message: `Report ${report.ticket_id} has exceeded SLA by ${violationHours} hours (Priority: ${report.priority})`,
              data: {
                violation_hours: violationHours,
                sla_hours: slaHours,
                priority: report.priority
              }
            }
          })
        );
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating SLA violation notification:', error);
    }
  }

  /**
   * Get available transitions for a report based on current status and user role
   * @param {string} reportId - Report ID
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {Promise<array>} Available transitions
   */
  async getAvailableTransitions(reportId, userRole, userId) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          submitter: true,
          assignee: true,
          block: true
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      const currentState = this.workflowStates[report.status];
      if (!currentState) {
        return [];
      }

      const availableTransitions = [];

      for (const toStatus of currentState.allowedTransitions) {
        const validation = await this.validateTransition(
          report.status, 
          toStatus, 
          userRole, 
          userId, 
          report
        );

        if (validation.valid) {
          availableTransitions.push({
            to_status: toStatus,
            action: validation.action,
            requires_data: this.getRequiredDataForTransition(toStatus)
          });
        }
      }

      return availableTransitions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get required data fields for a specific transition
   * @param {string} toStatus - Target status
   * @returns {array} Required data fields
   */
  getRequiredDataForTransition(toStatus) {
    const requirements = {
      approved: ['priority'],
      rejected: ['rejection_reason'],
      assigned: ['assigned_to'],
      completed: ['completion_notes'],
      closed: [], // May include rating/feedback but not required
      reopened: []
    };

    return requirements[toStatus] || [];
  }

  /**
   * Get workflow statistics for analytics
   * @param {object} filters - Filter options
   * @returns {Promise<object>} Workflow statistics
   */
  async getWorkflowStatistics(filters = {}) {
    try {
      const { start_date, end_date, block_id, category, priority } = filters;

      let whereCondition = {};
      
      if (start_date || end_date) {
        whereCondition.created_at = {};
        if (start_date) whereCondition.created_at.gte = new Date(start_date);
        if (end_date) whereCondition.created_at.lte = new Date(end_date);
      }
      
      if (block_id) whereCondition.block_id = block_id;
      if (category) whereCondition.category = category;
      if (priority) whereCondition.priority = priority;

      const [statusCounts, avgResolutionTime, slaViolations] = await Promise.all([
        // Status distribution
        prisma.report.groupBy({
          by: ['status'],
          where: whereCondition,
          _count: true
        }),

        // Average resolution time for completed reports
        prisma.report.aggregate({
          where: {
            ...whereCondition,
            status: { in: ['completed', 'closed'] }
          },
          _avg: {
            time_spent_minutes: true
          }
        }),

        // SLA violations count
        this.getSLAViolationsCount(whereCondition)
      ]);

      return {
        status_distribution: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        average_resolution_time_minutes: avgResolutionTime._avg.time_spent_minutes,
        sla_violations: slaViolations,
        total_reports: statusCounts.reduce((sum, item) => sum + item._count, 0)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get SLA violations count
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<number>} SLA violations count
   */
  async getSLAViolationsCount(whereCondition) {
    try {
      const reports = await prisma.report.findMany({
        where: {
          ...whereCondition,
          priority: { not: null },
          status: { not: 'closed' }
        },
        select: {
          priority: true,
          created_at: true
        }
      });

      let violationsCount = 0;
      const now = new Date();

      reports.forEach(report => {
        const slaHours = this.prioritySLA[report.priority];
        const hoursElapsed = (now - new Date(report.created_at)) / (1000 * 60 * 60);
        
        if (hoursElapsed > slaHours) {
          violationsCount++;
        }
      });

      return violationsCount;
    } catch (error) {
      console.error('Error calculating SLA violations:', error);
      return 0;
    }
  }
}

module.exports = new WorkflowService();