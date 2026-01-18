const reportService = require('../services/reportService');
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
   * Update report status
   * PUT /reports/:id/status
   */
  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, priority, assigned_to, rejection_reason } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get the report first to check permissions
      const report = await reportService.getReportById(id);
      
      // Check if user has permission to update this report's status
      const canUpdate = this.checkStatusUpdatePermission(report, userId, userRole, status);
      if (!canUpdate) {
        return res.status(403).json(forbiddenResponse(
          'You do not have permission to update this report status'
        ));
      }

      // Prepare additional data for the update
      const additionalData = {};
      if (notes) additionalData.notes = notes;
      if (priority) additionalData.priority = priority;
      if (assigned_to) additionalData.assigned_to = assigned_to;
      if (rejection_reason) additionalData.rejection_reason = rejection_reason;

      const updatedReport = await reportService.updateReportStatus(
        id, 
        status, 
        userId, 
        additionalData
      );

      res.status(200).json(successResponse(
        'Report status updated successfully',
        { report: updatedReport }
      ));
    } catch (error) {
      console.error('Update report status error:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json(notFoundResponse('Report'));
      }

      if (error.message.includes('Invalid status transition')) {
        return res.status(400).json(errorResponse(
          error.message,
          'REPORT_INVALID_STATUS_TRANSITION'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to update report status',
        'REPORT_STATUS_UPDATE_FAILED'
      ));
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