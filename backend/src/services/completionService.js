const prisma = require('../config/database');

/**
 * CompletionService - Manages report completion details and tracking
 * Handles completion data, rating submission, and feedback processing
 */
class CompletionService {
  /**
   * Create completion details when a report is marked as completed
   * @param {string} reportId - Report ID
   * @param {string} completedBy - User ID who completed the work
   * @param {object} completionData - Completion details
   * @returns {Promise<object>} Created completion details
   */
  async createCompletionDetails(reportId, completedBy, completionData) {
    try {
      const {
        completion_notes,
        parts_used,
        time_spent_minutes,
        completion_photos = []
      } = completionData;

      // Validate required fields
      if (!completion_notes || completion_notes.trim().length < 10) {
        throw new Error('Completion notes must be at least 10 characters long');
      }

      if (time_spent_minutes && (time_spent_minutes < 1 || time_spent_minutes > 1440)) {
        throw new Error('Time spent must be between 1 and 1440 minutes (24 hours)');
      }

      // Create completion details record
      const completionDetail = await prisma.completionDetail.create({
        data: {
          report_id: reportId,
          completed_by: completedBy,
          completion_notes: completion_notes.trim(),
          parts_used: parts_used ? parts_used.trim() : null,
          time_spent_minutes: time_spent_minutes || null,
          completion_photos: completion_photos
        }
      });

      return completionDetail;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get completion details for a report
   * @param {string} reportId - Report ID
   * @returns {Promise<object|null>} Completion details or null if not found
   */
  async getCompletionDetails(reportId) {
    try {
      const completionDetails = await prisma.completionDetail.findUnique({
        where: { report_id: reportId },
        include: {
          report: {
            select: {
              id: true,
              ticket_id: true,
              status: true
            }
          }
        }
      });

      return completionDetails;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update completion details
   * @param {string} reportId - Report ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated completion details
   */
  async updateCompletionDetails(reportId, updateData) {
    try {
      const {
        completion_notes,
        parts_used,
        time_spent_minutes,
        completion_photos
      } = updateData;

      const updateFields = {};
      
      if (completion_notes !== undefined) {
        if (completion_notes.trim().length < 10) {
          throw new Error('Completion notes must be at least 10 characters long');
        }
        updateFields.completion_notes = completion_notes.trim();
      }

      if (parts_used !== undefined) {
        updateFields.parts_used = parts_used ? parts_used.trim() : null;
      }

      if (time_spent_minutes !== undefined) {
        if (time_spent_minutes && (time_spent_minutes < 1 || time_spent_minutes > 1440)) {
          throw new Error('Time spent must be between 1 and 1440 minutes (24 hours)');
        }
        updateFields.time_spent_minutes = time_spent_minutes;
      }

      if (completion_photos !== undefined) {
        updateFields.completion_photos = completion_photos;
      }

      const updatedDetails = await prisma.completionDetail.update({
        where: { report_id: reportId },
        data: updateFields
      });

      return updatedDetails;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit rating and feedback for a completed report
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID submitting the rating
   * @param {object} ratingData - Rating and feedback data
   * @returns {Promise<object>} Rating submission result
   */
  async submitRating(reportId, userId, ratingData) {
    try {
      const { rating, comment, mark_still_broken = false } = ratingData;

      // Validate rating
      if (rating < 0 || rating > 5) {
        throw new Error('Rating must be between 0 and 5');
      }

      // Validate comment requirements based on rating
      if (rating <= 3) {
        if (!comment || comment.trim().length < 20) {
          throw new Error('Comment is required and must be at least 20 characters for ratings 0-3');
        }
      }

      if (comment && comment.length > 500) {
        throw new Error('Comment must not exceed 500 characters');
      }

      // Get the report to validate access and status
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          submitter: true,
          completion_details: true
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Validate that user is the report submitter
      if (report.submitted_by !== userId) {
        throw new Error('You can only rate your own reports');
      }

      // Validate that report is completed
      if (report.status !== 'completed') {
        throw new Error('You can only rate completed reports');
      }

      // Check if rating already exists
      if (report.rating !== null) {
        throw new Error('This report has already been rated');
      }

      // Determine new status based on rating and mark_still_broken flag
      let newStatus = 'closed';
      if (rating <= 1 || mark_still_broken) {
        newStatus = 'reopened';
      } else if (rating <= 3) {
        newStatus = 'under_review'; // For coordinator review
      }

      // Update report with rating and feedback, and handle workflow transition
      const result = await prisma.$transaction(async (tx) => {
        // Update report with rating and feedback
        const updatedReport = await tx.report.update({
          where: { id: reportId },
          data: {
            rating: rating,
            feedback: comment ? comment.trim() : null,
            status: newStatus,
            updated_at: new Date()
          },
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
            completion_details: true
          }
        });

        // Create workflow history entry for the rating
        await tx.workflowHistory.create({
          data: {
            report_id: reportId,
            user_id: userId,
            from_status: 'completed',
            to_status: newStatus,
            action: 'rate',
            notes: `Rating: ${rating}/5${comment ? ` - ${comment}` : ''}${mark_still_broken ? ' (marked as still broken)' : ''}`
          }
        });

        return updatedReport;
      });

      // Create notification for rating-based status change
      try {
        const notificationService = require('./notificationService');
        if (newStatus === 'reopened') {
          await notificationService.createReportNotification(result, 'reopened', {
            rating: rating,
            feedback: comment,
            reason: 'Low rating or marked as still broken'
          });
        } else if (newStatus === 'under_review') {
          await notificationService.createReportNotification(result, 'under_review', {
            rating: rating,
            feedback: comment,
            reason: 'Rating requires coordinator review'
          });
        }
      } catch (notificationError) {
        console.error('Error creating rating notification:', notificationError);
        // Don't throw error as this is not critical
      }

      return {
        success: true,
        report: result,
        new_status: newStatus,
        rating_submitted: true
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get rating and feedback for a report
   * @param {string} reportId - Report ID
   * @returns {Promise<object|null>} Rating data or null if not rated
   */
  async getRating(reportId) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          ticket_id: true,
          rating: true,
          feedback: true,
          status: true,
          updated_at: true
        }
      });

      if (!report || report.rating === null) {
        return null;
      }

      return {
        report_id: report.id,
        ticket_id: report.ticket_id,
        rating: report.rating,
        feedback: report.feedback,
        status: report.status,
        rated_at: report.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a report can be rated
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Rating eligibility result
   */
  async canRateReport(reportId, userId) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          ticket_id: true,
          status: true,
          rating: true,
          submitted_by: true,
          created_at: true
        }
      });

      if (!report) {
        return {
          can_rate: false,
          reason: 'Report not found'
        };
      }

      if (report.submitted_by !== userId) {
        return {
          can_rate: false,
          reason: 'You can only rate your own reports'
        };
      }

      if (report.status !== 'completed') {
        return {
          can_rate: false,
          reason: 'Report must be completed before rating'
        };
      }

      if (report.rating !== null) {
        return {
          can_rate: false,
          reason: 'Report has already been rated'
        };
      }

      // Check if rating window is still open (7 days after completion)
      if (report.completed_at) {
        const completedDate = new Date(report.completed_at);
        const now = new Date();
        const daysSinceCompletion = (now - completedDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCompletion > 7) {
          return {
            can_rate: false,
            reason: 'Rating window has expired (7 days after completion)'
          };
        }
      }

      return {
        can_rate: true,
        report_id: report.id,
        ticket_id: report.ticket_id
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get completion statistics for analytics
   * @param {object} filters - Filter options
   * @returns {Promise<object>} Completion statistics
   */
  async getCompletionStatistics(filters = {}) {
    try {
      const { start_date, end_date, category, priority, block_id } = filters;

      let whereCondition = {
        status: { in: ['completed', 'closed'] }
      };

      if (start_date || end_date) {
        whereCondition.created_at = {};
        if (start_date) whereCondition.created_at.gte = new Date(start_date);
        if (end_date) whereCondition.created_at.lte = new Date(end_date);
      }

      if (category) whereCondition.category = category;
      if (priority) whereCondition.priority = priority;
      if (block_id) whereCondition.block_id = block_id;

      const [
        totalCompleted,
        averageRating,
        ratingDistribution,
        averageCompletionTime
      ] = await Promise.all([
        // Total completed reports
        prisma.report.count({
          where: whereCondition
        }),

        // Average rating
        prisma.report.aggregate({
          where: {
            ...whereCondition,
            rating: { not: null }
          },
          _avg: {
            rating: true
          }
        }),

        // Rating distribution
        prisma.report.groupBy({
          by: ['rating'],
          where: {
            ...whereCondition,
            rating: { not: null }
          },
          _count: true
        }),

        // Average completion time from completion details
        prisma.completionDetail.aggregate({
          where: {
            report: whereCondition
          },
          _avg: {
            time_spent_minutes: true
          }
        })
      ]);

      return {
        total_completed: totalCompleted,
        average_rating: averageRating._avg.rating,
        rating_distribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count;
          return acc;
        }, {}),
        average_completion_time_minutes: averageCompletionTime._avg.time_spent_minutes
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CompletionService();