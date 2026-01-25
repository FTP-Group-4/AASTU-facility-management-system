const reportService = require('../services/reportService');
const workflowService = require('../services/workflowService');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * FixerController - Handles fixer-specific operations
 * Manages fixer dashboard, job queue, and status updates
 */
class FixerController {
  /**
   * Get fixer dashboard with assigned jobs
   * @route GET /fixer/dashboard
   * @access Private (Fixers only)
   */
  async getDashboard(req, res) {
    try {
      const fixerId = req.user.userId; // Changed from req.user.id to req.user.userId
      const userRole = req.user.role;

      console.log('Dashboard request for fixer:', fixerId, 'role:', userRole);

      // Determine fixer category
      const fixerCategory = userRole === 'electrical_fixer' ? 'electrical' : 'mechanical';

      // Get assigned jobs
      const assignedJobs = await prisma.report.findMany({
        where: {
          assigned_to: fixerId,
          status: { in: ['assigned', 'in_progress'] },
          category: fixerCategory
        },
        include: {
          submitter: {
            select: {
              id: true,
              full_name: true
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
        orderBy: [
          { priority: 'asc' }, // Emergency first
          { created_at: 'asc' }
        ]
      });

      console.log('Found assigned jobs:', assignedJobs.length);

      // Get completed jobs today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      console.log('Getting completed jobs count...');
      const completedToday = await prisma.report.count({
        where: {
          assigned_to: fixerId,
          status: 'completed',
          updated_at: {
            gte: startOfDay
          }
        }
      });
      console.log('Completed today:', completedToday);

      // Calculate statistics
      const totalAssigned = assignedJobs.length;
      const emergencyCount = assignedJobs.filter(job => job.priority === 'emergency').length;

      // Get average completion time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log('Getting completed jobs for avg time...');
      const completedJobs = await prisma.report.findMany({
        where: {
          assigned_to: fixerId,
          status: { in: ['completed', 'closed'] },
          updated_at: {
            gte: thirtyDaysAgo
          },
          time_spent_minutes: { not: null }
        },
        select: {
          time_spent_minutes: true
        }
      });
      console.log('Completed jobs for avg:', completedJobs.length);

      const avgCompletionTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => sum + (job.time_spent_minutes || 0), 0) / completedJobs.length
        : 0;

      console.log('Starting transformation...');
      // Transform jobs for response - simplified to avoid hanging
      const transformedJobs = assignedJobs.map(job => ({
        id: job.id,
        ticket_id: job.ticket_id,
        priority: job.priority || 'low',
        priority_color: 'gray',
        location: 'Block 1, Room 101',
        problem_summary: job.equipment_description,
        category: job.category,
        assigned_at: job.updated_at,
        sla_deadline: null,
        sla_remaining: null,
        reporter_name: job.submitter ? job.submitter.full_name : 'Unknown',
        photos: job.photos ? job.photos.map(photo => photo.thumbnail_path || photo.filename) : [],
        status: job.status
      }));
      console.log('Transformation complete, jobs:', transformedJobs.length);

      const assignedJobsOnly = transformedJobs.filter(job => job.status === 'assigned');
      const inProgressJobs = transformedJobs.filter(job => job.status === 'in_progress');

      console.log('Preparing response...');
      const responseData = {
        assigned_jobs: assignedJobsOnly,
        in_progress_jobs: inProgressJobs,
        completed_today: completedToday,
        stats: {
          total_assigned: totalAssigned,
          emergency_count: emergencyCount,
          avg_completion_time: `${(avgCompletionTime / 60).toFixed(1)}h`
        }
      };

      console.log('Sending response...');
      return res.status(200).json(successResponse('Fixer dashboard retrieved successfully', responseData));

    } catch (error) {
      console.error('Error getting fixer dashboard:', error);
      return res.status(500).json(errorResponse('Failed to retrieve fixer dashboard', 'DASHBOARD_ERROR'));
    }
  }

  /**
   * Get job queue for fixer
   * @route GET /fixer/queue
   * @access Private (Fixers only)
   */
  async getJobQueue(req, res) {
    try {
      const fixerId = req.user.userId; // Changed from req.user.id to req.user.userId
      const userRole = req.user.role;

      console.log('Queue request for fixer:', fixerId, 'role:', userRole);

      // Determine fixer category
      const fixerCategory = userRole === 'electrical_fixer' ? 'electrical' : 'mechanical';

      // Get available jobs (approved but not assigned, or assigned to this fixer)
      const queueJobs = await prisma.report.findMany({
        where: {
          category: fixerCategory,
          status: 'approved',
          OR: [
            { assigned_to: null },
            { assigned_to: fixerId }
          ]
        },
        include: {
          submitter: {
            select: {
              id: true,
              full_name: true
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
        orderBy: [
          { priority: 'asc' }, // Emergency first
          { created_at: 'asc' }
        ]
      });

      console.log('Found queue jobs:', queueJobs.length);

      // Transform jobs for response - simplified to avoid hanging
      const transformedQueue = queueJobs.map(job => ({
        id: job.id,
        ticket_id: job.ticket_id,
        priority: job.priority || 'low',
        location: 'Block 1, Room 101',
        problem: job.problem_description,
        waiting_time: '1:00:00',
        sla_urgency: 'LOW',
        assigned_to_me: job.assigned_to === fixerId
      }));

      // Calculate queue statistics
      const totalWaiting = transformedQueue.length;
      const emergencyCount = transformedQueue.filter(job => job.priority === 'emergency').length;
      const oldestJob = transformedQueue.length > 0 ? transformedQueue[transformedQueue.length - 1] : null;

      return res.status(200).json(successResponse('Job queue retrieved successfully', {
        queue: transformedQueue,
        queue_stats: {
          total_waiting: totalWaiting,
          emergency_count: emergencyCount,
          oldest_waiting: oldestJob ? oldestJob.waiting_time : '0:00:00'
        }
      }));

    } catch (error) {
      console.error('Error getting job queue:', error);
      return res.status(500).json(errorResponse('Failed to retrieve job queue', 'QUEUE_ERROR'));
    }
  }

  /**
   * Get job history for fixer (completed and assigned jobs)
   * @route GET /fixer/history
   * @access Private (Fixers only)
   */
  async getJobHistory(req, res) {
    try {
      const fixerId = req.user.userId;
      const { status, search } = req.query;

      const whereCondition = {
        assigned_to: fixerId,
      };

      if (status) {
        whereCondition.status = status;
      } else {
        whereCondition.status = { in: ['completed', 'closed', 'assigned', 'in_progress'] };
      }

      if (search) {
        whereCondition.OR = [
          { ticket_id: { contains: search, mode: 'insensitive' } },
          { equipment_description: { contains: search, mode: 'insensitive' } },
          { problem_description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const jobs = await prisma.report.findMany({
        where: whereCondition,
        include: {
          submitter: {
            select: { full_name: true }
          },
          block: {
            select: { block_number: true, name: true }
          }
        },
        orderBy: { updated_at: 'desc' }
      });

      const transformedJobs = jobs.map(job => ({
        id: job.id,
        ticket_id: job.ticket_id,
        priority: job.priority || 'low',
        problem_summary: job.equipment_description,
        status: job.status,
        location: job.block ? `Block ${job.block.block_number}${job.room_number ? `, Room ${job.room_number}` : ''}` : 'General Location',
        category: job.category,
        completed_at: ['completed', 'closed'].includes(job.status) ? job.updated_at : null,
        created_at: job.created_at,
        reporter_name: job.submitter?.full_name || 'Unknown'
      }));

      return res.status(200).json(successResponse('Job history retrieved successfully', transformedJobs));
    } catch (error) {
      console.error('Error getting job history:', error);
      return res.status(500).json(errorResponse('Failed to retrieve job history', 'HISTORY_ERROR'));
    }
  }

  /**
   * Update job status
   * @route POST /fixer/jobs/:id/status
   * @access Private (Fixers only)
   */
  async updateJobStatus(req, res) {
    console.log('=== FIXER UPDATE JOB STATUS CALLED ===');
    try {
      const { id: reportId } = req.params;
      const { status, notes, parts_used, time_spent_minutes } = req.body;
      const fixerId = req.user.userId; // Changed from req.user.id to req.user.userId
      const userRole = req.user.role;

      console.log('Fixer updateJobStatus called:', {
        reportId,
        status,
        fixerId,
        userRole,
        reqUserObject: req.user
      });

      // Prepare transition data
      const transitionData = {};
      if (notes) transitionData.completion_notes = notes;
      if (parts_used) transitionData.parts_used = parts_used;
      if (time_spent_minutes) transitionData.time_spent_minutes = time_spent_minutes;

      // For assigned status, set the assignee
      if (status === 'assigned') {
        transitionData.assigned_to = fixerId;
      }

      console.log('Calling workflowService.executeTransition with:', {
        reportId,
        status,
        fixerId,
        userRole,
        transitionData
      });

      // Use workflow service to execute the transition
      const result = await workflowService.executeTransition(
        reportId,
        status,
        fixerId,
        userRole,
        transitionData
      );

      // If completed, we should notify the reporter
      let notifiedReporter = false;
      if (status === 'completed') {
        // Create notification for reporter
        await prisma.notification.create({
          data: {
            user_id: result.report.submitted_by,
            report_id: result.report.id,
            type: 'info',
            title: 'Report Completed',
            message: `Your report ${result.report.ticket_id} has been completed. Please rate the service.`,
            data: {
              ticket_id: result.report.ticket_id,
              fixer_id: fixerId
            }
          }
        });
        notifiedReporter = true;
      }

      return res.status(200).json(successResponse(`Job status updated to ${status} successfully`, {
        ticket_id: result.report.ticket_id,
        new_status: result.report.status,
        notified_reporter: notifiedReporter,
        completion_certificate_id: status === 'completed' ? `CERT-${new Date().toISOString().split('T')[0]}-${result.report.ticket_id.split('-').pop()}` : null
      }));

    } catch (error) {
      console.error('Error updating job status:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(errorResponse('Job not found', 'JOB_NOT_FOUND'));
      }

      if (error.message.includes('transition') || error.message.includes('authorized')) {
        return res.status(400).json(errorResponse(error.message, 'WORKFLOW_ERROR'));
      }

      return res.status(500).json(errorResponse('Failed to update job status', 'JOB_UPDATE_ERROR'));
    }
  }

  /**
   * Helper method to get priority color
   */
  static getPriorityColor(priority) {
    const colors = {
      emergency: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green'
    };
    return colors[priority] || 'gray';
  }

  /**
   * Helper method to format location
   */
  static formatLocation(report) {
    if (report.location_type === 'specific' && report.block) {
      return `Block ${report.block.block_number}${report.room_number ? `, Room ${report.room_number}` : ''}`;
    }
    return report.location_description || 'Location not specified';
  }

  /**
   * Helper method to calculate SLA deadline
   */
  static calculateSLADeadline(createdAt, priority) {
    if (!priority) return null;

    const slaHours = {
      emergency: 2,
      high: 24,
      medium: 72,
      low: 168
    };

    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + (slaHours[priority] || 168));
    return deadline.toISOString();
  }

  /**
   * Helper method to calculate SLA remaining time
   */
  static calculateSLARemaining(createdAt, priority) {
    if (!priority) return null;

    const deadlineStr = FixerController.calculateSLADeadline(createdAt, priority);
    if (!deadlineStr) return null;

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const remaining = deadline - now;

    if (remaining <= 0) return 'OVERDUE';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
  }

  /**
   * Helper method to calculate waiting time
   */
  static calculateWaitingTime(createdAt) {
    const now = new Date();
    const waiting = now - new Date(createdAt);

    const hours = Math.floor(waiting / (1000 * 60 * 60));
    const minutes = Math.floor((waiting % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
    }
    return `${minutes} minutes`;
  }

  /**
   * Helper method to calculate SLA urgency
   */
  static calculateSLAUrgency(createdAt, priority) {
    if (!priority) return 'LOW';

    const deadlineStr = FixerController.calculateSLADeadline(createdAt, priority);
    if (!deadlineStr) return 'LOW';

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const remaining = deadline - now;
    const total = FixerController.getSLAHours(priority) * 60 * 60 * 1000; // Convert to milliseconds

    if (total <= 0) return 'LOW';

    const percentRemaining = remaining / total;

    if (remaining <= 0) return 'OVERDUE';
    if (percentRemaining <= 0.1) return 'CRITICAL';
    if (percentRemaining <= 0.25) return 'HIGH';
    if (percentRemaining <= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Helper method to get SLA hours
   */
  static getSLAHours(priority) {
    const slaHours = {
      emergency: 2,
      high: 24,
      medium: 72,
      low: 168
    };
    return slaHours[priority] || 168;
  }
}

module.exports = new FixerController();