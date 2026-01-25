const prisma = require('../config/database');
const { generateTicketId } = require('../utils/ticketGenerator');
const duplicateDetectionService = require('./duplicateDetectionService');
const workflowService = require('./workflowService');
const notificationService = require('./notificationService');

class ReportService {
  /**
   * Generate unique ticket ID with retry logic to handle race conditions
   * @returns {Promise<string>} Unique ticket ID
   */
  async generateUniqueTicketId() {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Count reports created today
        const todayReportsCount = await prisma.report.count({
          where: {
            created_at: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        });

        // Add attempt number to avoid collisions in concurrent requests
        const sequenceNumber = todayReportsCount + 1 + attempt;
        const ticketId = generateTicketId(sequenceNumber);

        // Check if this ticket ID already exists
        const existingReport = await prisma.report.findUnique({
          where: { ticket_id: ticketId }
        });

        if (!existingReport) {
          return ticketId;
        }

        attempt++;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        attempt++;
      }
    }

    throw new Error('Failed to generate unique ticket ID after maximum retries');
  }

  /**
   * Create a new report
   * @param {object} reportData - Report data
   * @param {string} userId - User ID of the submitter
   * @returns {Promise<object>} Created report
   */
  async createReport(reportData, userId) {
    try {
      const {
        category,
        location,
        equipment_description,
        problem_description
      } = reportData;

      // Enhanced location validation
      await this.validateLocation(location.type, location.block_id, location.room_number, location.description);

      // Generate unique ticket ID with retry logic
      const ticketId = await this.generateUniqueTicketId();

      // Create the report
      const report = await prisma.report.create({
        data: {
          ticket_id: ticketId,
          category,
          location_type: location.type,
          block_id: location.type === 'specific' ? location.block_id : null,
          room_number: location.type === 'specific' ? location.room_number : null,
          location_description: location.type === 'general' ? location.description : null,
          equipment_description,
          problem_description,
          status: 'submitted',
          submitted_by: userId
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
      await prisma.workflowHistory.create({
        data: {
          report_id: report.id,
          user_id: userId,
          from_status: null,
          to_status: 'submitted',
          action: 'submit',
          notes: 'Report submitted'
        }
      });

      // Create notification for report creation
      try {
        await notificationService.createReportNotification(report, 'created');
      } catch (error) {
        console.error('Error creating report notification:', error);
        // Don't throw error as this is not critical for report creation
      }

      return report;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate location data based on location type
   * @param {string} locationType - Location type ('specific' or 'general')
   * @param {number} blockId - Block ID (for specific locations)
   * @param {string} roomNumber - Room number (optional for specific locations)
   * @param {string} locationDescription - Location description (for general locations)
   */
  async validateLocation(locationType, blockId, roomNumber, locationDescription) {
    if (locationType === 'specific') {
      if (!blockId) {
        throw new Error('Block ID is required for specific locations');
      }

      // Validate block exists and is within range 1-100
      const block = await prisma.block.findFirst({
        where: {
          block_number: blockId,
          block_number: { gte: 1, lte: 100 }
        }
      });

      if (!block) {
        throw new Error('Invalid block number. Block must be between 1 and 100');
      }

      // Validate room number format if provided
      if (roomNumber) {
        const roomPattern = /^[A-Za-z0-9\-\.\/\s]{1,20}$/;
        if (!roomPattern.test(roomNumber)) {
          throw new Error('Invalid room number format. Use alphanumeric characters, hyphens, dots, slashes, and spaces only');
        }
      }
    } else if (locationType === 'general') {
      if (!locationDescription) {
        throw new Error('Location description is required for general locations');
      }

      if (locationDescription.length < 5) {
        throw new Error('Location description must be at least 5 characters long');
      }

      if (locationDescription.length > 200) {
        throw new Error('Location description must not exceed 200 characters');
      }
    } else {
      throw new Error('Invalid location type. Must be either "specific" or "general"');
    }
  }

  /**
   * Get report by ID
   * @param {string} reportId - Report ID
   * @returns {Promise<object>} Report data
   */
  async getReportById(reportId) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
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
          },
          photos: {
            select: {
              id: true,
              filename: true,
              original_name: true,
              file_path: true,
              thumbnail_path: true,
              created_at: true
            }
          },
          workflow_history: {
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
          }
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get report by ticket ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<object>} Report data
   */
  async getReportByTicketId(ticketId) {
    try {
      const report = await prisma.report.findUnique({
        where: { ticket_id: ticketId },
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
          },
          photos: {
            select: {
              id: true,
              filename: true,
              original_name: true,
              file_path: true,
              thumbnail_path: true,
              created_at: true
            }
          }
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get reports with filtering and pagination
   * @param {object} filters - Filter options
   * @param {string} userId - User ID for role-based filtering
   * @param {string} userRole - User role for access control
   * @returns {Promise<object>} Reports with pagination
   */
  async getReports(filters = {}, userId, userRole) {
    try {
      let {
        status,
        category,
        priority,
        block_id,
        submitted_by,
        assigned_to,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      // Ensure pagination params are integers
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 20;

      // Ensure block_id is integer if present
      if (block_id) {
        block_id = parseInt(block_id);
      }

      // Build where condition based on user role
      let whereCondition = {};

      // Role-based access control
      if (userRole === 'reporter') {
        whereCondition.submitted_by = userId;
      } else if (userRole === 'coordinator') {
        // Get coordinator's assigned blocks
        const assignments = await prisma.coordinatorAssignment.findMany({
          where: { coordinator_id: userId }
        });

        const assignedBlockIds = assignments
          .map(a => a.block_id)
          .filter(Boolean);
        const hasGeneralAssignment = assignments.some(a => a.block_id === null);

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
          whereCondition.id = 'never-match'; // No assignments
        }
      } else if (userRole === 'electrical_fixer' || userRole === 'mechanical_fixer') {
        const fixerCategory = userRole === 'electrical_fixer' ? 'electrical' : 'mechanical';
        whereCondition.AND = [
          { category: fixerCategory },
          {
            OR: [
              { assigned_to: userId },
              {
                status: { in: ['approved'] },
                assigned_to: null
              }
            ]
          }
        ];
      }
      // Admin can see all reports (no additional filtering)

      // Apply additional filters
      if (status) whereCondition.status = status;
      if (category) whereCondition.category = category;
      if (priority) whereCondition.priority = priority;
      if (block_id) whereCondition.block_id = block_id;
      if (submitted_by) whereCondition.submitted_by = submitted_by;
      if (assigned_to) whereCondition.assigned_to = assigned_to;

      // Get reports with pagination
      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: whereCondition,
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
            [sort_by]: sort_order
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.report.count({ where: whereCondition })
      ]);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update report status using workflow service
   * @param {string} reportId - Report ID
   * @param {string} newStatus - New status
   * @param {string} userId - User ID making the change
   * @param {string} userRole - User role
   * @param {object} transitionData - Additional data for the transition
   * @returns {Promise<object>} Updated report
   */
  async updateReportStatus(reportId, newStatus, userId, userRole, transitionData = {}) {
    try {
      return await workflowService.executeTransition(reportId, newStatus, userId, userRole, transitionData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available transitions for a report
   * @param {string} reportId - Report ID
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {Promise<array>} Available transitions
   */
  async getAvailableTransitions(reportId, userRole, userId) {
    try {
      return await workflowService.getAvailableTransitions(reportId, userRole, userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get workflow history for a report
   * @param {string} reportId - Report ID
   * @returns {Promise<array>} Workflow history
   */
  async getWorkflowHistory(reportId) {
    try {
      return await workflowService.getWorkflowHistory(reportId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for duplicate reports using enhanced duplicate detection service
   * @param {object} reportData - Report data to check
   * @returns {Promise<object>} Duplicate detection result
   */
  async checkForDuplicates(reportData) {
    try {
      return await duplicateDetectionService.checkForDuplicates(reportData);
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // Return safe fallback to not block report submission
      return {
        has_duplicates: false,
        duplicates: [],
        warning_message: null,
        error: 'Duplicate detection temporarily unavailable'
      };
    }
  }

  /**
   * Create a new report with duplicate detection
   * @param {object} reportData - Report data
   * @param {string} userId - User ID of the submitter
   * @param {boolean} ignoreDuplicates - Whether to ignore duplicate warnings
   * @returns {Promise<object>} Created report with duplicate information
   */
  async createReportWithDuplicateCheck(reportData, userId, ignoreDuplicates = false) {
    try {
      // Check for duplicates first (unless explicitly ignored)
      let duplicateResult = null;
      if (!ignoreDuplicates) {
        duplicateResult = await this.checkForDuplicates(reportData);

        // If high-confidence duplicates found, return warning without creating report
        if (duplicateResult.has_duplicates && !ignoreDuplicates) {
          return {
            success: false,
            duplicate_warning: true,
            duplicate_result: duplicateResult,
            message: duplicateResult.warning_message
          };
        }
      }

      // Create the report
      const report = await this.createReport(reportData, userId);

      // If duplicates were found but user chose to proceed, record the relationships
      if (duplicateResult && duplicateResult.duplicates.length > 0) {
        await this.recordDuplicateRelationships(report.id, duplicateResult.duplicates);
      }

      return {
        success: true,
        report,
        duplicate_result: duplicateResult
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record duplicate relationships for a new report
   * @param {string} newReportId - New report ID
   * @param {array} duplicates - Array of duplicate reports
   * @returns {Promise<void>}
   */
  async recordDuplicateRelationships(newReportId, duplicates) {
    try {
      const recordPromises = duplicates
        .filter(duplicate => duplicate.similarity_score >= 0.7) // Only record high-confidence duplicates
        .map(duplicate =>
          duplicateDetectionService.recordDuplicate(
            duplicate.report_id,
            newReportId,
            duplicate.similarity_score
          )
        );

      await Promise.all(recordPromises);
    } catch (error) {
      console.error('Error recording duplicate relationships:', error);
      // Don't throw error as this is not critical for report creation
    }
  }

  /**
   * Get duplicate reports for a given report
   * @param {string} reportId - Report ID
   * @returns {Promise<array>} Array of duplicate reports
   */
  async getDuplicateReports(reportId) {
    try {
      return await duplicateDetectionService.getDuplicateReports(reportId);
    } catch (error) {
      console.error('Error getting duplicate reports:', error);
      return [];
    }
  }

  /**
   * Associate photos with a report
   * @param {string} reportId - Report ID
   * @param {array} photoData - Array of photo data
   * @returns {Promise<array>} Created photo records
   */
  async associatePhotos(reportId, photoData) {
    try {
      const photos = await Promise.all(
        photoData.map(photo =>
          prisma.reportPhoto.create({
            data: {
              report_id: reportId,
              filename: photo.filename,
              original_name: photo.originalName,
              file_path: photo.filePath,
              file_size: photo.fileSize,
              mime_type: photo.mimeType,
              thumbnail_path: photo.thumbnailPath
            }
          })
        )
      );

      return photos;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a report (admin only)
   * @param {string} reportId - Report ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteReport(reportId) {
    try {
      // Delete related records first (cascade should handle this, but being explicit)
      await prisma.workflowHistory.deleteMany({
        where: { report_id: reportId }
      });

      await prisma.reportPhoto.deleteMany({
        where: { report_id: reportId }
      });

      await prisma.duplicateReport.deleteMany({
        where: {
          OR: [
            { original_report_id: reportId },
            { duplicate_report_id: reportId }
          ]
        }
      });

      await prisma.notification.deleteMany({
        where: { report_id: reportId }
      });

      // Delete the report
      await prisma.report.delete({
        where: { id: reportId }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReportService();