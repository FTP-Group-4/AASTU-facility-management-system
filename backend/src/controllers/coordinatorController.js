const reportService = require('../services/reportService');
const workflowService = require('../services/workflowService');
const userService = require('../services/userService');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * CoordinatorController - Handles coordinator-specific operations
 * Manages coordinator dashboard, report reviews, and priority assignments
 */
class CoordinatorController {
  /**
   * Get coordinator dashboard with assigned reports
   * @route GET /coordinator/dashboard
   * @access Private (Coordinators only)
   */
  async getDashboard(req, res) {
    try {
      const coordinatorId = req.user.userId; // Changed from req.user.id to req.user.userId
      
      // Get coordinator's assigned blocks
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: coordinatorId },
        include: {
          block: {
            select: {
              id: true,
              block_number: true,
              name: true
            }
          }
        }
      });

      const assignedBlockIds = assignments
        .map(a => a.block_id)
        .filter(Boolean);
      const hasGeneralAssignment = assignments.some(a => a.block_id === null);

      // Build where condition for reports
      let reportsWhere = {};
      
      if (hasGeneralAssignment && assignedBlockIds.length > 0) {
        reportsWhere.OR = [
          { block_id: { in: assignedBlockIds } },
          { location_type: 'general' }
        ];
      } else if (hasGeneralAssignment) {
        reportsWhere.location_type = 'general';
      } else if (assignedBlockIds.length > 0) {
        reportsWhere.block_id = { in: assignedBlockIds };
      } else {
        // No assignments - return empty dashboard
        return successResponse(res, {
          assignments: [],
          reports: {
            pending_review: [],
            under_review: [],
            approved: [],
            rejected: []
          },
          statistics: {
            total_reports: 0,
            pending_review: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            sla_violations: 0
          }
        }, 'Coordinator dashboard retrieved successfully');
      }

      // Get reports by status
      const [pendingReports, underReviewReports, approvedReports, rejectedReports] = await Promise.all([
        prisma.report.findMany({
          where: {
            ...reportsWhere,
            status: 'submitted'
          },
          include: {
            submitter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            block: {
              select: {
                id: true,
                block_number: true,
                name: true
              }
            },
            photos: {
              select: {
                id: true,
                filename: true,
                thumbnail_path: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }),
        
        prisma.report.findMany({
          where: {
            ...reportsWhere,
            status: 'under_review'
          },
          include: {
            submitter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            block: {
              select: {
                id: true,
                block_number: true,
                name: true
              }
            },
            photos: {
              select: {
                id: true,
                filename: true,
                thumbnail_path: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        }),

        prisma.report.findMany({
          where: {
            ...reportsWhere,
            status: 'approved'
          },
          include: {
            submitter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            assignee: {
              select: {
                id: true,
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
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10 // Limit recent approved reports
        }),

        prisma.report.findMany({
          where: {
            ...reportsWhere,
            status: 'rejected'
          },
          include: {
            submitter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            block: {
              select: {
                id: true,
                block_number: true,
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10 // Limit recent rejected reports
        })
      ]);

      // Calculate statistics
      const totalReports = await prisma.report.count({
        where: reportsWhere
      });

      // Check for SLA violations
      const slaViolations = await this.calculateSLAViolations(reportsWhere);

      const statistics = {
        total_reports: totalReports,
        pending_review: pendingReports.length,
        under_review: underReviewReports.length,
        approved: approvedReports.length,
        rejected: rejectedReports.length,
        sla_violations: slaViolations
      };

      return successResponse(res, {
        assignments: assignments.map(a => ({
          block_id: a.block_id,
          block_number: a.block?.block_number || null,
          block_name: a.block?.name || 'Location Not Specified',
          assigned_at: a.assigned_at
        })),
        reports: {
          pending_review: pendingReports,
          under_review: underReviewReports,
          approved: approvedReports,
          rejected: rejectedReports
        },
        statistics
      }, 'Coordinator dashboard retrieved successfully');

    } catch (error) {
      console.error('Error getting coordinator dashboard:', error);
      return errorResponse(res, 'Failed to retrieve coordinator dashboard', 'DASHBOARD_ERROR', 500);
    }
  }

  /**
   * Review a report (approve, reject, or set under review)
   * @route POST /coordinator/reports/:id/review
   * @access Private (Coordinators only)
   */
  async reviewReport(req, res) {
    try {
      const { id: reportId } = req.params;
      const { action, priority, rejection_reason, assigned_to, notes } = req.body;
      const coordinatorId = req.user.userId; // Changed from req.user.id to req.user.userId

      // Validate required fields
      if (!action || !['approve', 'reject', 'review'].includes(action)) {
        return errorResponse(res, 'Valid action is required (approve, reject, or review)', 'VALIDATION_ERROR', 400);
      }

      // Get the report to validate coordinator access
      const report = await reportService.getReportById(reportId);
      
      // Validate coordinator has access to this report
      const hasAccess = await workflowService.validateCoordinatorAccess(coordinatorId, report);
      if (!hasAccess) {
        return errorResponse(res, 'You do not have access to review this report', 'ACCESS_DENIED', 403);
      }

      let targetStatus;
      let transitionData = { notes };

      // Determine target status and required data based on action
      switch (action) {
        case 'review':
          targetStatus = 'under_review';
          break;

        case 'approve':
          if (!priority || !['emergency', 'high', 'medium', 'low'].includes(priority)) {
            return errorResponse(res, 'Valid priority is required when approving (emergency, high, medium, low)', 'VALIDATION_ERROR', 400);
          }
          targetStatus = 'approved';
          transitionData.priority = priority;
          
          // If assigned_to is provided, also assign the report
          if (assigned_to) {
            // Validate the assignee exists and has appropriate role
            const assignee = await userService.getUserById(assigned_to);
            if (!assignee) {
              return errorResponse(res, 'Assigned user not found', 'USER_NOT_FOUND', 404);
            }

            // Check if assignee role matches report category
            const requiredRole = report.category === 'electrical' ? 'electrical_fixer' : 'mechanical_fixer';
            if (assignee.role !== requiredRole && assignee.role !== 'admin') {
              return errorResponse(res, `Assignee must have role ${requiredRole} for ${report.category} reports`, 'INVALID_ASSIGNEE', 400);
            }

            transitionData.assigned_to = assigned_to;
            targetStatus = 'assigned'; // Skip approved status and go directly to assigned
          }
          break;

        case 'reject':
          if (!rejection_reason || rejection_reason.trim().length < 10) {
            return errorResponse(res, 'Rejection reason is required and must be at least 10 characters', 'VALIDATION_ERROR', 400);
          }
          targetStatus = 'rejected';
          transitionData.rejection_reason = rejection_reason.trim();
          break;
      }

      // Execute the workflow transition
      const result = await workflowService.executeTransition(
        reportId,
        targetStatus,
        coordinatorId,
        req.user.role,
        transitionData
      );

      // Create notification for the reporter
      await this.createReviewNotification(result.report, action, coordinatorId);

      return successResponse(res, {
        report: result.report,
        transition: result.transition,
        message: `Report ${action}ed successfully`
      }, `Report ${action}ed successfully`);

    } catch (error) {
      console.error('Error reviewing report:', error);
      
      if (error.message.includes('not found')) {
        return errorResponse(res, 'Report not found', 'REPORT_NOT_FOUND', 404);
      }
      
      if (error.message.includes('transition') || error.message.includes('authorized')) {
        return errorResponse(res, error.message, 'WORKFLOW_ERROR', 400);
      }

      return errorResponse(res, 'Failed to review report', 'REVIEW_ERROR', 500);
    }
  }

  /**
   * Get available fixers for assignment
   * @route GET /coordinator/fixers
   * @access Private (Coordinators only)
   */
  async getAvailableFixers(req, res) {
    try {
      const { category } = req.query;

      if (!category || !['electrical', 'mechanical'].includes(category)) {
        return errorResponse(res, 'Valid category is required (electrical or mechanical)', 'VALIDATION_ERROR', 400);
      }

      const requiredRole = category === 'electrical' ? 'electrical_fixer' : 'mechanical_fixer';

      // Get active fixers for the category
      const fixers = await prisma.user.findMany({
        where: {
          role: { in: [requiredRole, 'admin'] },
          is_active: true
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true
        },
        orderBy: {
          full_name: 'asc'
        }
      });

      // Get current workload for each fixer
      const fixersWithWorkload = await Promise.all(
        fixers.map(async (fixer) => {
          const activeReports = await prisma.report.count({
            where: {
              assigned_to: fixer.id,
              status: { in: ['assigned', 'in_progress'] }
            }
          });

          return {
            ...fixer,
            active_reports: activeReports
          };
        })
      );

      // Sort by workload (ascending) to show least busy fixers first
      fixersWithWorkload.sort((a, b) => a.active_reports - b.active_reports);

      return successResponse(res, {
        fixers: fixersWithWorkload,
        category
      }, 'Available fixers retrieved successfully');

    } catch (error) {
      console.error('Error getting available fixers:', error);
      return errorResponse(res, 'Failed to retrieve available fixers', 'FIXERS_ERROR', 500);
    }
  }

  /**
   * Get reports for assigned blocks with filtering
   * @route GET /coordinator/reports
   * @access Private (Coordinators only)
   */
  async getAssignedReports(req, res) {
    try {
      const coordinatorId = req.user.userId; // Changed from req.user.id to req.user.userId
      const filters = req.query;

      // Use the existing report service with coordinator filtering
      const result = await reportService.getReports(filters, coordinatorId, 'coordinator');

      return successResponse(res, result, 'Reports retrieved successfully');

    } catch (error) {
      console.error('Error getting assigned reports:', error);
      return errorResponse(res, 'Failed to retrieve assigned reports', 'REPORTS_ERROR', 500);
    }
  }

  /**
   * Get reports requiring coordinator attention (pending + under review)
   * @route GET /coordinator/reports/pending
   * @access Private (Coordinators only)
   */
  async getPendingReports(req, res) {
    try {
      const coordinatorId = req.user.userId; // Changed from req.user.id to req.user.userId
      const { page = 1, limit = 20, category, priority } = req.query;

      // Get coordinator's assigned blocks
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: coordinatorId }
      });

      const assignedBlockIds = assignments
        .map(a => a.block_id)
        .filter(Boolean);
      const hasGeneralAssignment = assignments.some(a => a.block_id === null);

      // Build where condition
      let whereCondition = {
        status: { in: ['submitted', 'under_review'] }
      };

      if (hasGeneralAssignment && assignedBlockIds.length > 0) {
        whereCondition.OR = [
          { block_id: { in: assignedBlockIds } },
          { location_type: 'general' }
        ];
      } else if (hasGeneralAssignment) {
        whereCondition.location_type = 'general';
      } else if (assignedBlockIds.length > 0) {
        whereCondition.block_id = { in: assignedBlockIds };
      } else {
        // No assignments
        return successResponse(res, {
          reports: [],
          pagination: { page: 1, limit: 20, total: 0, pages: 0 }
        }, 'No pending reports found');
      }

      // Apply additional filters
      if (category) whereCondition.category = category;
      if (priority) whereCondition.priority = priority;

      // Get reports with pagination
      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: whereCondition,
          include: {
            submitter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            block: {
              select: {
                id: true,
                block_number: true,
                name: true
              }
            },
            photos: {
              select: {
                id: true,
                filename: true,
                thumbnail_path: true
              }
            },
            workflow_history: {
              include: {
                user: {
                  select: {
                    full_name: true,
                    role: true
                  }
                }
              },
              orderBy: {
                created_at: 'desc'
              },
              take: 3 // Last 3 workflow entries
            }
          },
          orderBy: [
            { status: 'asc' }, // submitted first, then under_review
            { created_at: 'asc' } // oldest first
          ],
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.report.count({ where: whereCondition })
      ]);

      return successResponse(res, {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Pending reports retrieved successfully');

    } catch (error) {
      console.error('Error getting pending reports:', error);
      return errorResponse(res, 'Failed to retrieve pending reports', 'PENDING_REPORTS_ERROR', 500);
    }
  }

  /**
   * Calculate SLA violations for coordinator's reports
   * @param {object} whereCondition - Base where condition for reports
   * @returns {Promise<number>} Number of SLA violations
   */
  async calculateSLAViolations(whereCondition) {
    try {
      const reports = await prisma.report.findMany({
        where: {
          ...whereCondition,
          priority: { not: null },
          status: { not: { in: ['closed', 'rejected'] } }
        },
        select: {
          priority: true,
          created_at: true
        }
      });

      const prioritySLA = {
        emergency: 2,   // 2 hours
        high: 24,       // 24 hours
        medium: 72,     // 72 hours (3 days)
        low: 168        // 168 hours (7 days)
      };

      let violationsCount = 0;
      const now = new Date();

      reports.forEach(report => {
        const slaHours = prioritySLA[report.priority];
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

  /**
   * Create notification for report review action
   * @param {object} report - Report object
   * @param {string} action - Review action (approve, reject, review)
   * @param {string} coordinatorId - Coordinator ID
   * @returns {Promise<void>}
   */
  async createReviewNotification(report, action, coordinatorId) {
    try {
      let notificationType = 'info';
      let title = '';
      let message = '';

      switch (action) {
        case 'approve':
          notificationType = 'info';
          title = 'Report Approved';
          message = `Your report ${report.ticket_id} has been approved and will be assigned to a maintenance team.`;
          break;
        case 'reject':
          notificationType = 'warning';
          title = 'Report Rejected';
          message = `Your report ${report.ticket_id} has been rejected. Reason: ${report.rejection_reason}`;
          break;
        case 'review':
          notificationType = 'info';
          title = 'Report Under Review';
          message = `Your report ${report.ticket_id} is now under review by a coordinator.`;
          break;
      }

      await prisma.notification.create({
        data: {
          user_id: report.submitted_by,
          report_id: report.id,
          type: notificationType,
          title,
          message,
          data: {
            action,
            coordinator_id: coordinatorId,
            priority: report.priority
          }
        }
      });
    } catch (error) {
      console.error('Error creating review notification:', error);
    }
  }
}

module.exports = new CoordinatorController();