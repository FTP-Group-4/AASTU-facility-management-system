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
      const fixerId = req.user.id;
      const userRole = req.user.role;
      
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

      // Get completed jobs today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const completedToday = await prisma.report.count({
        where: {
          assigned_to: fixerId,
          status: 'completed',
          updated_at: {
            gte: startOfDay
          }
        }
      });

      // Calculate statistics
      const totalAssigned = assignedJobs.length;
      const emergencyCount = assignedJobs.filter(job => job.priority === 'emergency').length;

      // Get average completion time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

      const avgCompletionTime = completedJobs.length > 0 
        ? completedJobs.reduce((sum, job) => sum + (job.time_spent_minutes || 0), 0) / completedJobs.length
        : 0;

      // Transform jobs for response
      const transformedJobs = assignedJobs.map(job => ({
        ticket_id: job.ticket_id,
        priority: job.priority,
        priority_color: this.getPriorityColor(job.priority),
        location: this.formatLocation(job),
        problem_summary: job.equipment_description,
        category: job.category,
        assigned_at: job.updated_at, // When status changed to assigned
        sla_deadline: this.calculateSLADeadline(job.created_at, job.priority),
        sla_remaining: this.calculateSLARemaining(job.created_at, job.priority),
        reporter_name: job.submitter.full_name,
        photos: job.photos.map(photo => photo.thumbnail_path || photo.filename),
        status: job.status
      }));

      const assignedJobsOnly = transformedJobs.filter(job => job.status === 'assigned');
      const inProgressJobs = transformedJobs.filter(job => job.status === 'in_progress');

      return successResponse(res, {
        assigned_jobs: assignedJobsOnly,
        in_progress_jobs: inProgressJobs,
        completed_today: completedToday,
        stats: {
          total_assigned: totalAssigned,
          emergency_count: emergencyCount,
          avg_completion_time: `${(avgCompletionTime / 60).toFixed(1)}h`
        }
      }, 'Fixer dashboard retrieved successfully');

    } catch (error) {
      console.error('Error getting fixer dashboard:', error);
      return errorResponse(res, 'Failed to retrieve fixer dashboard', 'DASHBOARD_ERROR', 500);
    }
  }

  /**
   * Get job queue for fixer
   * @route GET /fixer/queue
   * @access Private (Fixers only)
   */
  async getJobQueue(req, res) {
    try {
      const fixerId = req.user.id;
      const userRole = req.user.role;
      
      // Determine fixer category
      const fixerCategory = userRole === 'electrical_fixer' ? 'electrical' : 'mechanical';

      // Get available jobs (approved but not assigned, or assigned to this fixer)
      const queueJobs = await prisma.report.findMany({
        where: {
          category: fixerCategory,
          status: { in: ['approved', 'assigned'] },
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

      // Transform jobs for response
      const transformedQueue = queueJobs.map(job => {
        const waitingTime = this.calculateWaitingTime(job.created_at);
        const slaUrgency = this.calculateSLAUrgency(job.created_at, job.priority);

        return {
          ticket_id: job.ticket_id,
          priority: job.priority,
          location: this.formatLocation(job),
          problem: job.problem_description,
          waiting_time: waitingTime,
          sla_urgency: slaUrgency,
          assigned_to_me: job.assigned_to === fixerId
        };
      });

      // Calculate queue statistics
      const totalWaiting = transformedQueue.length;
      const emergencyCount = transformedQueue.filter(job => job.priority === 'emergency').length;
      const oldestJob = transformedQueue.length > 0 ? transformedQueue[transformedQueue.length - 1] : null;

      return successResponse(res, {
        queue: transformedQueue,
        queue_stats: {
          total_waiting: totalWaiting,
          emergency_count: emergencyCount,
          oldest_waiting: oldestJob ? oldestJob.waiting_time : '0:00:00'
        }
      }, 'Job queue retrieved successfully');

    } catch (error) {
      console.error('Error getting job queue:', error);
      return errorResponse(res, 'Failed to retrieve job queue', 'QUEUE_ERROR', 500);
    }
  }

  /**
   * Update job status
   * @route POST /fixer/jobs/:id/status
   * @access Private (Fixers only)
   */
  async updateJobStatus(req, res) {
    try {
      const { id: reportId } = req.params;
      const { status, notes, parts_used, time_spent_minutes } = req.body;
      const fixerId = req.user.id;
      const userRole = req.user.role;

      // Prepare transition data
      const transitionData = {};
      if (notes) transitionData.completion_notes = notes;
      if (parts_used) transitionData.parts_used = parts_used;
      if (time_spent_minutes) transitionData.time_spent_minutes = time_spent_minutes;

      // For assigned status, set the assignee
      if (status === 'assigned') {
        transitionData.assigned_to = fixerId;
      }

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

      return successResponse(res, {
        ticket_id: result.report.ticket_id,
        new_status: result.report.status,
        notified_reporter: notifiedReporter,
        completion_certificate_id: status === 'completed' ? `CERT-${new Date().toISOString().split('T')[0]}-${result.report.ticket_id.split('-').pop()}` : null
      }, `Job status updated to ${status} successfully`);

    } catch (error) {
      console.error('Error updating job status:', error);

      if (error.message === 'Report not found') {
        return errorResponse(res, 'Job not found', 'JOB_NOT_FOUND', 404);
      }

      if (error.message.includes('transition') || error.message.includes('authorized')) {
        return errorResponse(res, error.message, 'WORKFLOW_ERROR', 400);
      }

      return errorResponse(res, 'Failed to update job status', 'JOB_UPDATE_ERROR', 500);
    }
  }

  /**
   * Helper method to get priority color
   */
  getPriorityColor(priority) {
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
  formatLocation(report) {
    if (report.location_type === 'specific' && report.block) {
      return `Block ${report.block.block_number}${report.room_number ? `, Room ${report.room_number}` : ''}`;
    }
    return report.location_description || 'Location not specified';
  }

  /**
   * Helper method to calculate SLA deadline
   */
  calculateSLADeadline(createdAt, priority) {
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
  calculateSLARemaining(createdAt, priority) {
    if (!priority) return null;

    const deadline = new Date(this.calculateSLADeadline(createdAt, priority));
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
  calculateWaitingTime(createdAt) {
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
  calculateSLAUrgency(createdAt, priority) {
    const deadline = new Date(this.calculateSLADeadline(createdAt, priority));
    const now = new Date();
    const remaining = deadline - now;
    const total = this.getSLAHours(priority) * 60 * 60 * 1000; // Convert to milliseconds

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
  getSLAHours(priority) {
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