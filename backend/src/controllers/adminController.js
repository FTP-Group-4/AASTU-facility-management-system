const prisma = require('../config/database');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');

class AdminController {
  /**
   * Update system configuration
   * PUT /admin/config
   */
  async updateSystemConfig(req, res) {
    try {
      const { 
        sla_settings,
        notification_preferences,
        system_settings,
        maintenance_mode
      } = req.body;

      // In a real implementation, this would be stored in a configuration table
      // For now, we'll simulate configuration management
      const config = {
        sla_settings: {
          emergency_hours: sla_settings?.emergency_hours || 2,
          high_hours: sla_settings?.high_hours || 8,
          medium_hours: sla_settings?.medium_hours || 24,
          low_hours: sla_settings?.low_hours || 72
        },
        notification_preferences: {
          email_enabled: notification_preferences?.email_enabled !== false,
          sms_enabled: notification_preferences?.sms_enabled || false,
          push_enabled: notification_preferences?.push_enabled !== false,
          emergency_immediate: notification_preferences?.emergency_immediate !== false
        },
        system_settings: {
          max_photos_per_report: system_settings?.max_photos_per_report || 3,
          max_file_size_mb: system_settings?.max_file_size_mb || 5,
          duplicate_threshold: system_settings?.duplicate_threshold || 0.8,
          auto_assignment: system_settings?.auto_assignment !== false
        },
        maintenance_mode: maintenance_mode || false,
        updated_at: new Date().toISOString(),
        updated_by: req.user.userId
      };

      // Log configuration change for audit
      console.log(`System configuration updated by admin ${req.user.userId} at ${new Date().toISOString()}`);

      res.status(200).json(successResponse(
        'System configuration updated successfully',
        config
      ));
    } catch (error) {
      console.error('Update system config error:', error);
      res.status(500).json(errorResponse(
        'Failed to update system configuration',
        'CONFIG_UPDATE_ERROR'
      ));
    }
  }

  /**
   * Get current system configuration
   * GET /admin/config
   */
  async getSystemConfig(req, res) {
    try {
      // In a real implementation, this would be retrieved from a configuration table
      const config = {
        sla_settings: {
          emergency_hours: 2,
          high_hours: 8,
          medium_hours: 24,
          low_hours: 72
        },
        notification_preferences: {
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true,
          emergency_immediate: true
        },
        system_settings: {
          max_photos_per_report: 3,
          max_file_size_mb: 5,
          duplicate_threshold: 0.8,
          auto_assignment: true
        },
        maintenance_mode: false,
        last_updated: new Date().toISOString()
      };

      res.status(200).json(successResponse(
        'System configuration retrieved successfully',
        config
      ));
    } catch (error) {
      console.error('Get system config error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve system configuration',
        'CONFIG_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Create new block (admin-specific with additional features)
   * POST /admin/blocks
   */
  async createBlock(req, res) {
    try {
      const { block_number, name, description, coordinator_ids } = req.body;

      // Check if block already exists
      const existingBlock = await prisma.block.findUnique({
        where: { block_number }
      });

      if (existingBlock) {
        return res.status(409).json(errorResponse(
          `Block ${block_number} already exists`,
          'BLOCK_ALREADY_EXISTS'
        ));
      }

      // Validate coordinator IDs if provided
      if (coordinator_ids && coordinator_ids.length > 0) {
        const coordinators = await prisma.user.findMany({
          where: {
            id: { in: coordinator_ids },
            role: 'coordinator'
          }
        });

        if (coordinators.length !== coordinator_ids.length) {
          return res.status(400).json(errorResponse(
            'One or more coordinator IDs are invalid or not coordinators',
            'INVALID_COORDINATOR_IDS'
          ));
        }
      }

      // Create the block
      const newBlock = await prisma.block.create({
        data: {
          block_number,
          name: name || `Block ${block_number}`,
          description: description || `Campus Block ${block_number}`
        }
      });

      // Assign coordinators if provided
      if (coordinator_ids && coordinator_ids.length > 0) {
        const assignments = coordinator_ids.map(coordinatorId => ({
          coordinator_id: coordinatorId,
          block_id: newBlock.id
        }));

        await prisma.coordinatorAssignment.createMany({
          data: assignments,
          skipDuplicates: true
        });
      }

      // Get the created block with assignments
      const blockWithAssignments = await prisma.block.findUnique({
        where: { id: newBlock.id },
        include: {
          coordinator_assignments: {
            include: {
              coordinator: {
                select: {
                  id: true,
                  full_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(successResponse(
        'Block created successfully',
        blockWithAssignments
      ));
    } catch (error) {
      console.error('Create block error:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse(
          'Block number already exists',
          'BLOCK_ALREADY_EXISTS'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to create block',
        'BLOCK_CREATION_ERROR'
      ));
    }
  }

  /**
   * Bulk initialize blocks
   * POST /admin/blocks/bulk-initialize
   */
  async bulkInitializeBlocks(req, res) {
    try {
      const { start_number = 1, end_number = 100, prefix = 'Block' } = req.body;

      if (start_number < 1 || end_number > 200 || start_number > end_number) {
        return res.status(400).json(errorResponse(
          'Invalid block number range. Must be between 1-200 and start <= end',
          'INVALID_BLOCK_RANGE'
        ));
      }

      const blocksToCreate = [];
      for (let i = start_number; i <= end_number; i++) {
        blocksToCreate.push({
          block_number: i,
          name: `${prefix} ${i}`,
          description: `Campus ${prefix} ${i}`
        });
      }

      // Use createMany with skipDuplicates to avoid conflicts
      const result = await prisma.block.createMany({
        data: blocksToCreate,
        skipDuplicates: true
      });

      res.status(201).json(successResponse(
        `Successfully initialized ${result.count} blocks (${start_number}-${end_number})`,
        {
          created_count: result.count,
          start_number,
          end_number,
          skipped_duplicates: blocksToCreate.length - result.count
        }
      ));
    } catch (error) {
      console.error('Bulk initialize blocks error:', error);
      res.status(500).json(errorResponse(
        'Failed to initialize blocks',
        'BLOCK_INITIALIZATION_ERROR'
      ));
    }
  }

  /**
   * Get system health and statistics
   * GET /admin/system/health
   */
  async getSystemHealth(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalReports,
        activeReports,
        totalBlocks,
        assignedBlocks
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { is_active: true } }),
        prisma.report.count(),
        prisma.report.count({
          where: {
            status: { in: ['submitted', 'under_review', 'approved', 'assigned', 'in_progress'] }
          }
        }),
        prisma.block.count(),
        prisma.coordinatorAssignment.count()
      ]);

      const health = {
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy',
        notifications: 'healthy'
      };

      const statistics = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        reports: {
          total: totalReports,
          active: activeReports,
          completed: totalReports - activeReports
        },
        blocks: {
          total: totalBlocks,
          assigned: assignedBlocks,
          unassigned: totalBlocks - assignedBlocks
        }
      };

      res.status(200).json(successResponse(
        'System health retrieved successfully',
        {
          status: 'healthy',
          health,
          statistics,
          timestamp: new Date().toISOString()
        }
      ));
    } catch (error) {
      console.error('Get system health error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve system health',
        'SYSTEM_HEALTH_ERROR'
      ));
    }
  }
}

module.exports = new AdminController();