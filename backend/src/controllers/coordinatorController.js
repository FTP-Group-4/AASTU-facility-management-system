const reportService = require('../services/reportService');
const workflowService = require('../services/workflowService');
const userService = require('../services/userService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const prisma = require('../config/database');
const { Prisma } = require('@prisma/client');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');

/**
 * CoordinatorController - Optimized and Standardized
 * Strictly follows AASTU Facilities Management System API Documentation
 * Fixes the "Postman hanging" bug by correctly calling res.json()
 */
class CoordinatorController {
  constructor() {
    this.getDashboard = this.getDashboard.bind(this);
    this.reviewReport = this.reviewReport.bind(this);
    this.getAssignedReports = this.getAssignedReports.bind(this);
    this.getPendingReports = this.getPendingReports.bind(this);
    this.getAvailableFixers = this.getAvailableFixers.bind(this);
  }

  /**
   * coordinator: Get Dashboard
   * GET /coordinator/dashboard
   */
  async getDashboard(req, res) {
    const startTime = Date.now();
    try {
      const coordinatorId = req.user.userId || req.user.id;

      // 1. Get coordinator's assigned blocks
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

      const assignedBlockIds = assignments.map(a => a.block_id).filter(Boolean);
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
        // No assignments - return empty dashboard structure
        return res.status(200).json(successResponse('Coordinator dashboard retrieved successfully', {
          assigned_blocks: [],
          pending_reports: [],
          stats: {
            total_pending: 0,
            approved_today: 0,
            sla_compliance_rate: 100
          }
        }));
      }

      // 2. Prepare date boundaries
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const slaCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h for general stats

      // 3. Fetch data in parallel
      const [
        pendingReports,
        totalPending,
        approvedToday,
        totalReports,
        blockStatsRaw,
        overdueStatsRaw
      ] = await Promise.all([
        // Top 10 pending reports
        prisma.report.findMany({
          where: { ...reportsWhere, status: 'submitted' },
          include: {
            submitter: { select: { id: true, full_name: true } },
            block: { select: { id: true, block_number: true, name: true } },
            photos: { select: { id: true } }
          },
          orderBy: { created_at: 'asc' },
          take: 10
        }),
        // Overall stats
        prisma.report.count({ where: { ...reportsWhere, status: 'submitted' } }),
        prisma.report.count({
          where: {
            ...reportsWhere,
            status: { in: ['approved', 'assigned', 'in_progress', 'completed', 'closed'] },
            updated_at: { gte: startOfToday }
          }
        }),
        prisma.report.count({ where: reportsWhere }),
        // Block-wise stats
        prisma.report.groupBy({
          by: ['block_id', 'status'],
          where: { block_id: { in: assignedBlockIds } },
          _count: true
        }),
        prisma.report.groupBy({
          by: ['block_id'],
          where: {
            block_id: { in: assignedBlockIds },
            status: { notIn: ['completed', 'closed', 'rejected'] },
            created_at: { lt: slaCutoff }
          },
          _count: true
        })
      ]);

      // 4. Process block statistics
      const blockMap = {};
      assignments.forEach(a => {
        if (a.block_id) {
          blockMap[a.block_id] = {
            block_id: a.block.block_number,
            block_name: a.block.name || `Block ${a.block.block_number}`,
            pending_approvals: 0,
            in_progress: 0,
            overdue: 0
          };
        }
      });

      blockStatsRaw.forEach(stat => {
        const entry = blockMap[stat.block_id];
        if (!entry) return;
        if (stat.status === 'submitted') {
          entry.pending_approvals += stat._count;
        } else if (['approved', 'assigned', 'in_progress'].includes(stat.status)) {
          entry.in_progress += stat._count;
        }
      });

      overdueStatsRaw.forEach(stat => {
        const entry = blockMap[stat.block_id];
        if (entry) {
          entry.overdue = stat._count;
        }
      });

      // 5. Calculate SLA compliance
      const slaViolations = await this.calculateSLAViolationsCount(reportsWhere);
      const slaComplianceRate = totalReports > 0
        ? Math.round(((totalReports - slaViolations) / totalReports) * 100)
        : 100;

      // 6. Populate duplicates for pending reports
      const reportsWithDuplicates = await Promise.all(pendingReports.map(async (report) => {
        const duplicateResult = await duplicateDetectionService.checkForDuplicates({
          location: { type: report.location_type, block_id: report.block_id, room_number: report.room_number },
          equipment_description: report.equipment_description,
          problem_description: report.problem_description,
          category: report.category
        }).catch(() => ({ duplicates: [] }));

        return {
          ticket_id: report.ticket_id,
          category: report.category,
          location: report.location_type === 'specific'
            ? `Block ${report.block?.block_number || '?'}${report.room_number ? ', Room ' + report.room_number : ''}`
            : (report.location_description || 'General Location'),
          problem_summary: report.equipment_description,
          submitted_at: report.created_at,
          submitted_by: report.submitter?.full_name || 'Anonymous',
          photos_count: report.photos?.length || 0,
          possible_duplicates: (duplicateResult.duplicates || []).map(d => ({
            ticket_id: d.ticket_id,
            status: d.status
          }))
        };
      }));

      const responseData = {
        assigned_blocks: Object.values(blockMap),
        pending_reports: reportsWithDuplicates,
        stats: {
          total_pending: totalPending,
          approved_today: approvedToday,
          sla_compliance_rate: Math.min(100, Math.max(0, slaComplianceRate))
        }
      };

      console.log(`[Dashboard] Finished in ${Date.now() - startTime}ms`);
      return res.status(200).json(successResponse('Coordinator dashboard retrieved successfully', responseData));

    } catch (error) {
      console.error('Error getting coordinator dashboard:', error);
      return res.status(500).json(errorResponse('Failed to retrieve coordinator dashboard', 'DASHBOARD_ERROR'));
    }
  }

  /**
   * coordinator: Review & Approve/Reject Report
   * POST /coordinator/reports/:ticket_id/review
   */
  async reviewReport(req, res) {
    try {
      const { ticket_id } = req.params;
      const { action, priority, rejection_reason } = req.body;
      const coordinatorId = req.user.userId || req.user.id;

      if (!action || !['approve', 'reject', 'reviewing'].includes(action)) {
        return res.status(400).json(errorResponse('Valid action is required (approve, reject, or reviewing)', 'VALID_002'));
      }

      if (action === 'approve' && (!priority || !['emergency', 'high', 'medium', 'low'].includes(priority))) {
        return res.status(400).json(errorResponse('Valid priority is required for approval', 'VALID_003'));
      }

      if (action === 'reject' && (!rejection_reason || rejection_reason.trim().length < 5)) {
        return res.status(400).json(errorResponse('Valid rejection reason is required for rejection', 'VALID_002'));
      }

      const report = await prisma.report.findUnique({
        where: { ticket_id },
        include: { block: true }
      });

      if (!report) {
        return res.status(404).json(notFoundResponse('Report'));
      }

      // Permission check
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: coordinatorId }
      });

      const hasAccess = assignments.some(a => a.block_id === report.block_id || a.block_id === null);
      if (!hasAccess && req.user.role !== 'admin') {
        return res.status(403).json(errorResponse('You do not have access to this report', 'REPORT_003'));
      }

      let targetStatus;
      let transitionData = {};

      if (action === 'approve') {
        targetStatus = 'approved';
        transitionData.priority = priority;
      } else if (action === 'reject') {
        targetStatus = 'rejected';
        transitionData.rejection_reason = rejection_reason;
      } else if (action === 'reviewing') {
        targetStatus = 'under_review';
      }

      await workflowService.executeTransition(
        report.id,
        targetStatus,
        coordinatorId,
        req.user.role,
        transitionData
      );

      let sla_deadline = null;
      if (action === 'approve') {
        const slaHours = { emergency: 2, high: 24, medium: 72, low: 168 };
        const deadline = new Date(report.created_at);
        deadline.setHours(deadline.getHours() + (slaHours[priority] || 168));
        sla_deadline = deadline.toISOString();
      }

      const responseData = {
        ticket_id: report.ticket_id,
        new_status: targetStatus,
        priority: priority || report.priority,
        sla_deadline: sla_deadline,
        message: action === 'approve' ? 'Report approved and assigned to maintenance queue' : `Report ${action}ed successfully`
      };

      return res.status(200).json(successResponse(responseData.message, responseData));

    } catch (error) {
      console.error('Error reviewing report:', error);
      return res.status(500).json(errorResponse(error.message || 'Failed to review report', 'SYSTEM_001'));
    }
  }

  /**
   * coordinator: Get Reports for Assigned Blocks
   * GET /coordinator/reports
   */
  async getAssignedReports(req, res) {
    try {
      const coordinatorId = req.user.userId || req.user.id;
      const result = await reportService.getReports(req.query, coordinatorId, 'coordinator');
      return res.status(200).json(successResponse('Reports retrieved successfully', result));
    } catch (error) {
      console.error('Error getting assigned reports:', error);
      return res.status(500).json(errorResponse('Failed to retrieve assigned reports', 'SYSTEM_001'));
    }
  }

  /**
   * coordinator: Get Available Fixers
   * GET /coordinator/fixers
   */
  async getAvailableFixers(req, res) {
    try {
      const { category } = req.query;
      let where = { role: { in: ['electrical_fixer', 'mechanical_fixer'] }, is_active: true };
      if (category) {
        where.role = category === 'electrical' ? 'electrical_fixer' : 'mechanical_fixer';
      }

      const fixers = await prisma.user.findMany({
        where,
        select: {
          id: true, full_name: true, email: true, role: true,
          _count: {
            select: { assigned_reports: { where: { status: { in: ['assigned', 'in_progress'] } } } }
          }
        }
      });

      const transformedFixers = fixers.map(f => ({
        id: f.id, full_name: f.full_name, email: f.email, role: f.role,
        active_reports: f._count.assigned_reports
      })).sort((a, b) => a.active_reports - b.active_reports);

      return res.status(200).json(successResponse('Available fixers retrieved successfully', { fixers: transformedFixers }));
    } catch (error) {
      console.error('Error getting available fixers:', error);
      return res.status(500).json(errorResponse('Failed to retrieve available fixers', 'SYSTEM_001'));
    }
  }

  /**
   * coordinator: Get Pending Reports
   * GET /coordinator/reports/pending
   */
  async getPendingReports(req, res) {
    try {
      const coordinatorId = req.user.userId || req.user.id;
      const filters = { ...req.query, status: 'submitted' };
      const result = await reportService.getReports(filters, coordinatorId, 'coordinator');
      return res.status(200).json(successResponse('Pending reports retrieved successfully', result));
    } catch (error) {
      console.error('Error getting pending reports:', error);
      return res.status(500).json(errorResponse('Failed to retrieve pending reports', 'SYSTEM_001'));
    }
  }

  /**
   * Helper: Calculate SLA violations count
   */
  async calculateSLAViolationsCount(whereCondition) {
    try {
      const slaLimits = { emergency: 2, high: 24, medium: 72, low: 168 };
      const now = new Date();
      const counts = await Promise.all(
        Object.entries(slaLimits).map(([priority, hours]) => {
          const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
          return prisma.report.count({
            where: {
              ...whereCondition,
              priority: priority,
              status: { notIn: ['completed', 'closed', 'rejected'] },
              created_at: { lt: cutoff }
            }
          });
        })
      );
      return counts.reduce((acc, c) => acc + c, 0);
    } catch (error) {
      console.error('Error calculating SLA violations:', error);
      return 0;
    }
  }
}

module.exports = new CoordinatorController();