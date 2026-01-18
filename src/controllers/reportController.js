const reportService = require('../services/reportService');
const workflowService = require('../services/workflowService');
const fileService = require('../services/fileService');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response');

/**
 * Calculate SLA deadline based on priority
 * @param {Date} submittedAt - Report submission date
 * @param {string} priority - Report priority level
 * @returns {string} SLA deadline ISO string
 */
function calculateSLADeadline(submittedAt, priority) {
  if (!priority) return null;
  
  const slaHours = {
    'emergency': 2,
    'high': 24,
    'medium': 72,
    'low': 168
  };

  const deadline = new Date(submittedAt);
  deadline.setHours(deadline.getHours() + (slaHours[priority] || 168));
  return deadline.toISOString();
}

class ReportController {
  /**
   * Create a new report with photo upload support
   * POST /reports
   */
  async createReport(req, res) {
    try {
      const userId = req.user.userId;
      const reportData = req.body;
      const ignoreDuplicates = req.body.ignore_duplicates === 'true' || req.body.ignore_duplicates === true;

      // Validate photos are provided (1-3 required per requirements)
      if (!req.files || req.files.length === 0) {
        return res.status(400).json(errorResponse(
          'At least 1 photo is required per report',
          'REPORT_MISSING_PHOTOS'
        ));
      }

      if (req.files.length > 3) {
        return res.status(400).json(errorResponse(
          'Maximum 3 photos allowed per report',
          'REPORT_TOO_MANY_PHOTOS'
        ));
      }

      // Validate photos
      const photoValidation = fileService.validatePhotoUpload(req.files);
      if (!photoValidation.valid) {
        return res.status(400).json(errorResponse(
          photoValidation.error,
          'REPORT_INVALID_PHOTOS'
        ));
      }

      // Create report with duplicate detection
      const result = await reportService.createReportWithDuplicateCheck(
        reportData, 
        userId, 
        ignoreDuplicates
      );

      // If duplicates found and user hasn't chosen to ignore them
      if (!result.success && result.duplicate_warning) {
        return res.status(409).json({
          success: false,
          data: {
            duplicate_ticket_id: result.duplicate_result.duplicates[0]?.ticket_id,
            duplicate_status: result.duplicate_result.duplicates[0]?.status,
            message: "Similar issue already reported"
          },
          error_code: 'DUPLICATE_REPORT',
          timestamp: new Date().toISOString()
        });
      }

      const report = result.report;

      // Process and associate photos
      let processedPhotos = [];
      try {
        // Process photos
        const photoResults = await fileService.processMultiplePhotos(req.files);
        
        // Prepare photo data for database
        const photoData = photoResults.map(photo => ({
          filename: photo.filename,
          originalName: photo.originalName,
          filePath: photo.url,
          fileSize: photo.size,
          mimeType: photo.mimetype,
          thumbnailPath: photo.thumbnailUrl
        }));

        // Associate photos with report
        processedPhotos = await reportService.associatePhotos(report.id, photoData);
      } catch (photoError) {
        console.error('Photo processing error:', photoError);
        // If photo processing fails, delete the report and return error
        await reportService.deleteReport(report.id);
        return res.status(500).json(errorResponse(
          'Failed to process photos. Please try again.',
          'REPORT_PHOTO_PROCESSING_FAILED'
        ));
      }

      // Get coordinator assignment info (simplified for now)
      const coordinatorAssigned = {
        name: "System Coordinator",
        email: "coordinator@aastu.edu.et"
      };

      // Prepare response data
      const responseData = {
        ticket_id: report.ticket_id,
        status: report.status,
        submitted_at: report.created_at,
        coordinator_assigned: coordinatorAssigned,
        message: "Report submitted successfully"
      };

      // Include duplicate information if any were found
      if (result.duplicate_result && result.duplicate_result.duplicates.length > 0) {
        responseData.duplicate_info = {
          similar_reports_found: result.duplicate_result.duplicates.length,
          message: "Report submitted successfully. Similar reports were found but you chose to proceed."
        };
      }

      // Return response in expected format
      res.status(201).json(successResponse(
        'Report submitted successfully',
        responseData
      ));
    } catch (error) {
      console.error('Create report error:', error);

      if (error.message === 'Block ID is required for specific locations') {
        return res.status(400).json(errorResponse(
          'Block ID is required when location type is "specific"',
          'VALID_001'
        ));
      }

      if (error.message === 'Location description is required for general locations') {
        return res.status(400).json(errorResponse(
          'Location description is required when location type is "general"',
          'VALID_002'
        ));
      }

      if (error.message.includes('Invalid block number')) {
        return res.status(400).json(errorResponse(
          'Invalid block number. Block must be between 1 and 100',
          'VALID_001'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to create report. Please try again.',
        'SYSTEM_001'
      ));
    }
  }

  /**
   * Get report by ID or ticket ID
   * GET /reports/:id
   */
  async getReport(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      let report;
      
      // Check if ID is a ticket ID format (AASTU-FIX-...)
      if (id.startsWith('AASTU-FIX-')) {
        report = await reportService.getReportByTicketId(id);
      } else {
        report = await reportService.getReportById(id);
      }

      // Check access permissions
      const hasAccess = this.checkReportAccess(report, userId, userRole);
      if (!hasAccess) {
        return res.status(403).json(forbiddenResponse(
          'You do not have permission to view this report'
        ));
      }

      res.status(200).json(successResponse(
        'Report retrieved successfully',
        { report }
      ));
    } catch (error) {
      console.error('Get report error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve report',
        'REPORT_GET_FAILED'
      ));
    }
  }

  /**
   * Get reports for the current user (reporter's own reports)
   * GET /reports/my
   */
  async getMyReports(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      
      // Only reporters should use this endpoint
      if (userRole !== 'reporter') {
        return res.status(403).json(forbiddenResponse(
          'This endpoint is only available for reporters. Use GET /reports instead.'
        ));
      }

      const filters = {
        ...req.query,
        submitted_by: userId // Force filter to user's own reports
      };

      const result = await reportService.getReports(filters, userId, userRole);

      // Transform response to match API documentation format
      const transformedReports = result.reports.map(report => ({
        ticket_id: report.ticket_id,
        category: report.category,
        location: {
          block_id: report.block_id,
          block_name: report.block ? `Block ${report.block.block_number}` : null,
          room_number: report.room_number,
          description: report.location_description
        },
        problem_summary: report.equipment_description,
        status: report.status,
        priority: report.priority,
        submitted_at: report.created_at,
        sla_deadline: calculateSLADeadline(report.created_at, report.priority),
        current_assignee: report.assignee ? report.assignee.full_name : null
      }));

      // Calculate summary statistics
      const summary = {
        total: result.pagination.total,
        pending: result.reports.filter(r => ['submitted', 'under_review'].includes(r.status)).length,
        in_progress: result.reports.filter(r => ['approved', 'assigned', 'in_progress'].includes(r.status)).length,
        completed: result.reports.filter(r => ['completed', 'closed'].includes(r.status)).length
      };

      res.status(200).json(successResponse(
        'Reports retrieved successfully',
        {
          reports: transformedReports,
          summary,
          pagination: result.pagination
        }
      ));
    } catch (error) {
      console.error('Get my reports error:', error);

      res.status(500).json(errorResponse(
        'Failed to retrieve reports',
        'SYSTEM_001'
      ));
    }
  }

  /**
   * Calculate SLA deadline based on priority
   * @param {Date} submittedAt - Submission date
  /**
   * Get reports with filtering and pagination
   * GET /reports
   */
  async getReports(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const filters = req.query;

      const result = await reportService.getReports(filters, userId, userRole);

      res.status(200).json(successResponse(
        'Reports retrieved successfully',
        result
      ));
    } catch (error) {
      console.error('Get reports error:', error);

      res.status(500).json(errorResponse(
        'Failed to retrieve reports',
        'SYSTEM_001'
      ));
    }
  }

  /**
   * Update report status using workflow service
   * PUT /reports/:id/status
   */
  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, priority, assigned_to, rejection_reason, completion_notes, parts_used, time_spent_minutes, rating, feedback } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Prepare transition data
      const transitionData = {};
      if (notes) transitionData.notes = notes;
      if (priority) transitionData.priority = priority;
      if (assigned_to) transitionData.assigned_to = assigned_to;
      if (rejection_reason) transitionData.rejection_reason = rejection_reason;
      if (completion_notes) transitionData.completion_notes = completion_notes;
      if (parts_used) transitionData.parts_used = parts_used;
      if (time_spent_minutes) transitionData.time_spent_minutes = time_spent_minutes;
      if (rating !== undefined) transitionData.rating = rating;
      if (feedback) transitionData.feedback = feedback;

      // Use workflow service to execute the transition
      const result = await workflowService.executeTransition(
        id, 
        status, 
        userId, 
        userRole,
        transitionData
      );

      res.status(200).json(successResponse(
        'Report status updated successfully',
        { 
          report: result.report,
          transition: result.transition
        }
      ));
    } catch (error) {
      console.error('Update report status error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      if (error.message.includes('transition') || error.message.includes('authorized') || error.message.includes('Role')) {
        return res.status(400).json(errorResponse(
          error.message,
          'WORKFLOW_ERROR'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to update report status',
        'REPORT_STATUS_UPDATE_FAILED'
      ));
    }
  }

  /**
   * Get available transitions for a report
   * GET /reports/:id/transitions
   */
  async getAvailableTransitions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get the report first to check permissions
      const report = await reportService.getReportById(id);
      
      // Check access permissions
      const hasAccess = this.checkReportAccess(report, userId, userRole);
      if (!hasAccess) {
        return res.status(403).json(forbiddenResponse(
          'You do not have permission to view this report'
        ));
      }

      // Get available transitions
      const transitions = await workflowService.getAvailableTransitions(id, userRole, userId);

      res.status(200).json(successResponse(
        'Available transitions retrieved successfully',
        {
          report_id: report.id,
          ticket_id: report.ticket_id,
          current_status: report.status,
          available_transitions: transitions
        }
      ));
    } catch (error) {
      console.error('Get available transitions error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve available transitions',
        'TRANSITIONS_GET_FAILED'
      ));
    }
  }

  /**
   * Get workflow history for a report
   * GET /reports/:id/history
   */
  async getWorkflowHistory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get the report first to check permissions
      const report = await reportService.getReportById(id);
      
      // Check access permissions
      const hasAccess = this.checkReportAccess(report, userId, userRole);
      if (!hasAccess) {
        return res.status(403).json(forbiddenResponse(
          'You do not have permission to view this report'
        ));
      }

      // Get workflow history
      const history = await workflowService.getWorkflowHistory(id);

      res.status(200).json(successResponse(
        'Workflow history retrieved successfully',
        {
          report_id: report.id,
          ticket_id: report.ticket_id,
          workflow_history: history
        }
      ));
    } catch (error) {
      console.error('Get workflow history error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve workflow history',
        'WORKFLOW_HISTORY_GET_FAILED'
      ));
    }
  }

  /**
   * Submit rating and feedback for completed report
   * POST /reports/:id/rate
   */
  async rateReport(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment, mark_still_broken } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get the report first to validate access
      const report = await reportService.getReportById(id);
      
      // Only reporters can rate their own completed reports
      if (userRole !== 'reporter' || report.submitted_by !== userId) {
        return errorResponse(res, 'You can only rate your own completed reports', 'ACCESS_DENIED', 403);
      }

      // Check if report is completed
      if (report.status !== 'completed') {
        return errorResponse(res, 'You can only rate completed reports', 'INVALID_STATUS', 400);
      }

      // Determine new status based on rating
      let newStatus = 'closed';
      if (rating <= 1 || mark_still_broken) {
        newStatus = 'reopened';
      } else if (rating <= 3) {
        newStatus = 'under_review'; // For coordinator review
      }

      // Prepare transition data
      const transitionData = {
        rating,
        feedback: comment || null
      };

      // Use workflow service to execute the transition
      const result = await workflowService.executeTransition(
        id,
        newStatus,
        userId,
        userRole,
        transitionData
      );

      // Create appropriate message based on new status
      let message = 'Thank you for your feedback.';
      if (newStatus === 'reopened') {
        message = 'Report has been reopened for further attention.';
      } else if (newStatus === 'under_review') {
        message = 'Thank you for your feedback. Coordinator will review.';
      } else {
        message = 'Thank you for your feedback. Report has been closed.';
      }

      return successResponse(res, {
        ticket_id: result.report.ticket_id,
        new_status: newStatus,
        message
      }, message);

    } catch (error) {
      console.error('Error rating report:', error);

      if (error.message === 'Report not found') {
        return errorResponse(res, 'Report not found', 'REPORT_NOT_FOUND', 404);
      }

      if (error.message.includes('transition') || error.message.includes('authorized')) {
        return errorResponse(res, error.message, 'WORKFLOW_ERROR', 400);
      }

      return errorResponse(res, 'Failed to submit rating', 'RATING_ERROR', 500);
    }
  }

  /**
   * Check for duplicate reports
   * POST /reports/check-duplicates
   */
  async checkDuplicates(req, res) {
    try {
      const reportData = req.body;
      const duplicateResult = await reportService.checkForDuplicates(reportData);

      res.status(200).json(successResponse(
        'Duplicate check completed',
        {
          has_duplicates: duplicateResult.has_duplicates,
          duplicates: duplicateResult.duplicates,
          warning_message: duplicateResult.warning_message,
          allow_anyway: duplicateResult.allow_anyway || true, // Always allow user to proceed
          message: duplicateResult.has_duplicates 
            ? duplicateResult.warning_message
            : 'No similar reports found.'
        }
      ));
    } catch (error) {
      console.error('Check duplicates error:', error);

      res.status(500).json(errorResponse(
        'Failed to check for duplicates',
        'REPORT_DUPLICATE_CHECK_FAILED'
      ));
    }
  }

  /**
   * Get duplicate reports for a specific report
   * GET /reports/:id/duplicates
   */
  async getReportDuplicates(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get the report first to check permissions
      let report;
      
      // Check if ID is a ticket ID format (AASTU-FIX-...)
      if (id.startsWith('AASTU-FIX-')) {
        report = await reportService.getReportByTicketId(id);
      } else {
        report = await reportService.getReportById(id);
      }
      
      // For now, allow access to all authenticated users
      // TODO: Implement proper access control based on user role and report ownership

      // Get duplicate reports
      const duplicates = await reportService.getDuplicateReports(report.id);

      res.status(200).json(successResponse(
        'Duplicate reports retrieved successfully',
        {
          report_id: report.id,
          ticket_id: report.ticket_id,
          duplicates: duplicates,
          total_duplicates: duplicates.length
        }
      ));
    } catch (error) {
      console.error('Get report duplicates error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve duplicate reports',
        'REPORT_DUPLICATES_GET_FAILED'
      ));
    }
  }

  /**
   * Delete a report (admin only)
   * DELETE /reports/:id
   */
  async deleteReport(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      // Only admins can delete reports
      if (userRole !== 'admin') {
        return res.status(403).json(forbiddenResponse(
          'Only administrators can delete reports'
        ));
      }

      // Check if report exists
      await reportService.getReportById(id);

      // Delete the report
      await reportService.deleteReport(id);

      res.status(200).json(successResponse(
        'Report deleted successfully',
        null
      ));
    } catch (error) {
      console.error('Delete report error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      res.status(500).json(errorResponse(
        'Failed to delete report',
        'REPORT_DELETE_FAILED'
      ));
    }
  }

  /**
   * Check if user has access to view a report
   * @param {object} report - Report object
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {boolean} Access permission
   */
  checkReportAccess(report, userId, userRole) {
    // Admin can access all reports
    if (userRole === 'admin') return true;

    // Reporter can access their own reports
    if (userRole === 'reporter' && report.submitted_by === userId) return true;

    // Assigned fixer can access their assigned reports
    if ((userRole === 'electrical_fixer' || userRole === 'mechanical_fixer') && 
        report.assigned_to === userId) return true;

    // Coordinator can access reports in their assigned blocks
    if (userRole === 'coordinator') {
      // This would need to check coordinator assignments
      // For now, we'll allow access (this should be implemented properly)
      return true;
    }

    return false;
  }

  /**
   * Check if user has permission to update report status
   * @param {object} report - Report object
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {string} newStatus - New status to set
   * @returns {boolean} Update permission
   */
  checkStatusUpdatePermission(report, userId, userRole, newStatus) {
    // Admin can update any status
    if (userRole === 'admin') return true;

    // Coordinator permissions
    if (userRole === 'coordinator') {
      const coordinatorStatuses = ['under_review', 'approved', 'rejected'];
      return coordinatorStatuses.includes(newStatus);
    }

    // Fixer permissions
    if (userRole === 'electrical_fixer' || userRole === 'mechanical_fixer') {
      const fixerStatuses = ['in_progress', 'completed'];
      return fixerStatuses.includes(newStatus) && report.assigned_to === userId;
    }

    // Reporter can only reopen completed reports
    if (userRole === 'reporter') {
      return newStatus === 'reopened' && 
             report.submitted_by === userId && 
             report.status === 'completed';
    }

    return false;
  }
}

module.exports = new ReportController();