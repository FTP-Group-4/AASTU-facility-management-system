const prisma = require('../config/database');
const authService = require('./authService');

class UserService {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} User data
   */
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          department: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile with role-specific data
   * @param {string} userId - User ID
   * @returns {Promise<object>} User profile with statistics
   */
  async getUserProfile(userId) {
    try {
      const user = await this.getUserById(userId);
      
      // Get role-specific statistics
      let roleSpecificData = {};

      switch (user.role) {
        case 'reporter':
          const reporterStats = await this.getReporterStatistics(userId);
          roleSpecificData = {
            phone: user.phone,
            department: user.department,
            stats: reporterStats
          };
          break;
        case 'coordinator':
          const coordinatorData = await this.getCoordinatorStatistics(userId);
          roleSpecificData = {
            assigned_blocks: coordinatorData.assigned_blocks,
            location_not_specified: coordinatorData.location_not_specified,
            stats: coordinatorData.stats
          };
          break;
        case 'electrical_fixer':
        case 'mechanical_fixer':
          const fixerStats = await this.getFixerStatistics(userId);
          roleSpecificData = {
            specialization: user.role === 'electrical_fixer' ? 'Electrical Systems' : 'Mechanical Systems',
            team: user.role === 'electrical_fixer' ? 'Electrical Team A' : 'Mechanical Team A',
            stats: fixerStats
          };
          break;
        case 'admin':
          const adminStats = await this.getAdminStatistics();
          roleSpecificData = adminStats;
          break;
        default:
          roleSpecificData = {};
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        created_at: user.created_at,
        ...roleSpecificData
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated user
   */
  async updateUserProfile(userId, updateData) {
    try {
      const { full_name, phone, avatar } = updateData;

      // Handle avatar upload if provided (simplified for now)
      // In a real implementation, you would process the base64 image and save it

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(full_name && { full_name }),
          ...(phone && { phone }),
          updated_at: new Date()
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          department: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get reporter statistics
   * @param {string} userId - Reporter user ID
   * @returns {Promise<object>} Reporter statistics
   */
  async getReporterStatistics(userId) {
    try {
      const [totalReports, pendingReports, avgRating] = await Promise.all([
        prisma.report.count({
          where: { submitted_by: userId }
        }),
        prisma.report.count({
          where: { 
            submitted_by: userId,
            status: { in: ['submitted', 'under_review', 'approved', 'assigned', 'in_progress'] }
          }
        }),
        prisma.report.aggregate({
          where: { 
            submitted_by: userId,
            rating: { not: null }
          },
          _avg: {
            rating: true
          }
        })
      ]);

      return {
        reports_submitted: totalReports,
        reports_pending: pendingReports,
        avg_rating_given: avgRating._avg.rating || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get coordinator statistics
   * @param {string} userId - Coordinator user ID
   * @returns {Promise<object>} Coordinator statistics
   */
  async getCoordinatorStatistics(userId) {
    try {
      // Get assigned blocks
      const assignedBlocks = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: userId },
        include: { block: true }
      });

      const blockIds = assignedBlocks.map(assignment => assignment.block_id).filter(Boolean);
      const hasGeneralAssignment = assignedBlocks.some(assignment => assignment.block_id === null);

      // Build where condition for reports
      let reportWhereCondition = {};
      if (hasGeneralAssignment && blockIds.length > 0) {
        reportWhereCondition = {
          OR: [
            { block_id: { in: blockIds } },
            { location_type: 'general' }
          ]
        };
      } else if (hasGeneralAssignment) {
        reportWhereCondition = { location_type: 'general' };
      } else if (blockIds.length > 0) {
        reportWhereCondition = { block_id: { in: blockIds } };
      } else {
        reportWhereCondition = { id: 'never-match' }; // No assignments
      }

      const [pendingApprovals, approvedToday] = await Promise.all([
        prisma.report.count({
          where: {
            ...reportWhereCondition,
            status: { in: ['submitted', 'under_review'] }
          }
        }),
        prisma.report.count({
          where: {
            ...reportWhereCondition,
            status: { in: ['approved', 'assigned', 'in_progress', 'completed'] },
            updated_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      // Calculate SLA compliance (simplified)
      const slaCompliance = 92.5; // This would be calculated based on actual SLA data

      return {
        assigned_blocks: assignedBlocks.map(assignment => ({
          block_id: assignment.block_id,
          block_name: assignment.block ? `Block ${assignment.block.block_number}` : 'Location Not Specified'
        })),
        location_not_specified: hasGeneralAssignment,
        stats: {
          pending_approvals: pendingApprovals,
          approved_today: approvedToday,
          sla_compliance: slaCompliance
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get fixer statistics
   * @param {string} userId - Fixer user ID
   * @returns {Promise<object>} Fixer statistics
   */
  async getFixerStatistics(userId) {
    try {
      const [jobsCompleted, jobsInProgress, averageCompletionTime] = await Promise.all([
        prisma.report.count({
          where: { 
            assigned_to: userId,
            status: 'completed'
          }
        }),
        prisma.report.count({
          where: { 
            assigned_to: userId,
            status: 'in_progress'
          }
        }),
        prisma.report.aggregate({
          where: { 
            assigned_to: userId,
            status: 'completed',
            time_spent_minutes: { not: null }
          },
          _avg: {
            time_spent_minutes: true
          }
        })
      ]);

      // Get average rating for this fixer
      const avgRating = await prisma.report.aggregate({
        where: {
          assigned_to: userId,
          rating: { not: null }
        },
        _avg: {
          rating: true
        }
      });

      const avgCompletionHours = averageCompletionTime._avg.time_spent_minutes 
        ? (averageCompletionTime._avg.time_spent_minutes / 60).toFixed(1) + 'h'
        : '0h';

      return {
        jobs_completed: jobsCompleted,
        jobs_in_progress: jobsInProgress,
        avg_completion_time: avgCompletionHours,
        avg_rating: avgRating._avg.rating || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get admin statistics
   * @returns {Promise<object>} Admin statistics
   */
  async getAdminStatistics() {
    try {
      const [totalUsers, activeReports] = await Promise.all([
        prisma.user.count({ where: { is_active: true } }),
        prisma.report.count({
          where: { status: { in: ['submitted', 'under_review', 'approved', 'assigned', 'in_progress'] } }
        })
      ]);

      return {
        permissions: ['*'],
        system_stats: {
          total_users: totalUsers,
          active_reports: activeReports,
          system_uptime: '99.8%'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new user (admin function)
   * @param {object} userData - User data
   * @returns {Promise<object>} Created user
   */
  async createUser(userData) {
    return await authService.createUser(userData);
  }

  /**
   * Update user role and status (admin function)
   * @param {string} userId - User ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const { role, is_active } = updateData;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role,
          is_active,
          updated_at: new Date()
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  /**
   * Get all users (admin function)
   * @param {object} filters - Filter options
   * @returns {Promise<array>} List of users
   */
  async getAllUsers(filters = {}) {
    try {
      const { role, is_active, page = 1, limit = 50 } = filters;
      
      const where = {};
      if (role) where.role = role;
      if (typeof is_active === 'boolean') where.is_active = is_active;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.user.count({ where });

      return {
        users,
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
}

module.exports = new UserService();