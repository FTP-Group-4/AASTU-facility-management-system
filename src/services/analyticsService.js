const prisma = require('../config/database');

class AnalyticsService {
  /**
   * Get system-wide analytics data
   * @param {object} filters - Date range and other filters
   * @returns {Promise<object>} Analytics data
   */
  async getSystemAnalytics(filters = {}) {
    try {
      const {
        start_date,
        end_date,
        block_id,
        category,
        priority
      } = filters;

      // Build date filter
      const dateFilter = {};
      if (start_date) dateFilter.gte = new Date(start_date);
      if (end_date) dateFilter.lte = new Date(end_date);

      // Build where condition
      const whereCondition = {};
      if (Object.keys(dateFilter).length > 0) {
        whereCondition.created_at = dateFilter;
      }
      if (block_id) whereCondition.block_id = block_id;
      if (category) whereCondition.category = category;
      if (priority) whereCondition.priority = priority;

      // Get basic counts
      const [
        totalReports,
        completedReports,
        pendingReports,
        emergencyReports,
        highPriorityReports,
        averageRating,
        reportsByStatus,
        reportsByCategory,
        reportsByPriority,
        reportsByBlock,
        completionTimes,
        recentActivity
      ] = await Promise.all([
        // Total reports
        prisma.report.count({ where: whereCondition }),
        
        // Completed reports
        prisma.report.count({
          where: { ...whereCondition, status: 'completed' }
        }),
        
        // Pending reports (not completed or closed)
        prisma.report.count({
          where: {
            ...whereCondition,
            status: { notIn: ['completed', 'closed', 'rejected'] }
          }
        }),
        
        // Emergency reports
        prisma.report.count({
          where: { ...whereCondition, priority: 'emergency' }
        }),
        
        // High priority reports
        prisma.report.count({
          where: { ...whereCondition, priority: 'high' }
        }),
        
        // Average rating
        prisma.report.aggregate({
          where: { ...whereCondition, rating: { not: null } },
          _avg: { rating: true }
        }),
        
        // Reports by status
        prisma.report.groupBy({
          by: ['status'],
          where: whereCondition,
          _count: { status: true }
        }),
        
        // Reports by category
        prisma.report.groupBy({
          by: ['category'],
          where: whereCondition,
          _count: { category: true }
        }),
        
        // Reports by priority
        prisma.report.groupBy({
          by: ['priority'],
          where: whereCondition,
          _count: { priority: true }
        }),
        
        // Reports by block
        prisma.report.groupBy({
          by: ['block_id'],
          where: { ...whereCondition, block_id: { not: null } },
          _count: { block_id: true },
          orderBy: { _count: { block_id: 'desc' } },
          take: 10
        }),
        
        // Completion times for performance metrics
        this.getCompletionTimeMetrics(whereCondition),
        
        // Recent activity (last 7 days)
        this.getRecentActivity(7)
      ]);

      // Calculate completion rate
      const completionRate = totalReports > 0 ? (completedReports / totalReports) * 100 : 0;

      // Calculate SLA compliance
      const slaCompliance = await this.calculateSLACompliance(whereCondition);

      // Get top performing blocks
      const topPerformingBlocks = await this.getTopPerformingBlocks(whereCondition);

      // Get user performance metrics
      const userPerformance = await this.getUserPerformanceMetrics(whereCondition);

      return {
        summary: {
          total_reports: totalReports,
          completed_reports: completedReports,
          pending_reports: pendingReports,
          completion_rate: Math.round(completionRate * 100) / 100,
          average_rating: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 100) / 100 : null,
          emergency_reports: emergencyReports,
          high_priority_reports: highPriorityReports
        },
        distributions: {
          by_status: reportsByStatus.map(item => ({
            status: item.status,
            count: item._count.status
          })),
          by_category: reportsByCategory.map(item => ({
            category: item.category,
            count: item._count.category
          })),
          by_priority: reportsByPriority.map(item => ({
            priority: item.priority,
            count: item._count.priority
          })),
          by_block: await this.enrichBlockData(reportsByBlock)
        },
        performance: {
          completion_times: completionTimes,
          sla_compliance: slaCompliance,
          top_performing_blocks: topPerformingBlocks,
          user_performance: userPerformance
        },
        activity: {
          recent_activity: recentActivity
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get completion time metrics
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<object>} Completion time metrics
   */
  async getCompletionTimeMetrics(whereCondition) {
    try {
      const completedReports = await prisma.report.findMany({
        where: {
          ...whereCondition,
          status: 'completed',
          time_spent_minutes: { not: null }
        },
        select: {
          time_spent_minutes: true,
          priority: true,
          category: true,
          created_at: true,
          updated_at: true
        }
      });

      if (completedReports.length === 0) {
        return {
          average_completion_time: null,
          median_completion_time: null,
          by_priority: {},
          by_category: {}
        };
      }

      // Calculate overall metrics
      const completionTimes = completedReports.map(r => r.time_spent_minutes);
      const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
      
      const sortedTimes = completionTimes.sort((a, b) => a - b);
      const medianTime = sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)];

      // Group by priority
      const byPriority = {};
      const byCategory = {};

      completedReports.forEach(report => {
        if (report.priority) {
          if (!byPriority[report.priority]) {
            byPriority[report.priority] = [];
          }
          byPriority[report.priority].push(report.time_spent_minutes);
        }

        if (!byCategory[report.category]) {
          byCategory[report.category] = [];
        }
        byCategory[report.category].push(report.time_spent_minutes);
      });

      // Calculate averages for each group
      Object.keys(byPriority).forEach(priority => {
        const times = byPriority[priority];
        byPriority[priority] = {
          count: times.length,
          average: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
        };
      });

      Object.keys(byCategory).forEach(category => {
        const times = byCategory[category];
        byCategory[category] = {
          count: times.length,
          average: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
        };
      });

      return {
        average_completion_time: Math.round(averageTime),
        median_completion_time: Math.round(medianTime),
        by_priority: byPriority,
        by_category: byCategory
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate SLA compliance metrics
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<object>} SLA compliance data
   */
  async calculateSLACompliance(whereCondition) {
    try {
      // SLA targets in hours
      const slaTargets = {
        emergency: 2,   // 2 hours
        high: 8,        // 8 hours
        medium: 24,     // 24 hours
        low: 72         // 72 hours
      };

      const reports = await prisma.report.findMany({
        where: {
          ...whereCondition,
          priority: { not: null },
          status: { in: ['completed', 'closed'] }
        },
        select: {
          priority: true,
          created_at: true,
          updated_at: true
        }
      });

      const compliance = {};
      
      Object.keys(slaTargets).forEach(priority => {
        const priorityReports = reports.filter(r => r.priority === priority);
        
        if (priorityReports.length === 0) {
          compliance[priority] = {
            total: 0,
            compliant: 0,
            compliance_rate: 0,
            target_hours: slaTargets[priority]
          };
          return;
        }

        const compliantReports = priorityReports.filter(report => {
          const completionTime = new Date(report.updated_at) - new Date(report.created_at);
          const hoursToComplete = completionTime / (1000 * 60 * 60);
          return hoursToComplete <= slaTargets[priority];
        });

        compliance[priority] = {
          total: priorityReports.length,
          compliant: compliantReports.length,
          compliance_rate: Math.round((compliantReports.length / priorityReports.length) * 100),
          target_hours: slaTargets[priority]
        };
      });

      // Calculate overall compliance
      const totalReports = Object.values(compliance).reduce((sum, p) => sum + p.total, 0);
      const totalCompliant = Object.values(compliance).reduce((sum, p) => sum + p.compliant, 0);
      const overallCompliance = totalReports > 0 ? Math.round((totalCompliant / totalReports) * 100) : 0;

      return {
        overall_compliance_rate: overallCompliance,
        by_priority: compliance
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get top performing blocks based on completion rate and satisfaction
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<array>} Top performing blocks
   */
  async getTopPerformingBlocks(whereCondition) {
    try {
      const blockPerformance = await prisma.report.groupBy({
        by: ['block_id'],
        where: { ...whereCondition, block_id: { not: null } },
        _count: { id: true },
        _avg: { rating: true }
      });

      const enrichedBlocks = await Promise.all(
        blockPerformance.map(async (blockData) => {
          const [block, completedCount] = await Promise.all([
            prisma.block.findUnique({
              where: { id: blockData.block_id },
              select: { block_number: true, name: true }
            }),
            prisma.report.count({
              where: {
                ...whereCondition,
                block_id: blockData.block_id,
                status: 'completed'
              }
            })
          ]);

          const completionRate = blockData._count.id > 0 
            ? (completedCount / blockData._count.id) * 100 
            : 0;

          return {
            block_id: blockData.block_id,
            block_number: block?.block_number,
            block_name: block?.name,
            total_reports: blockData._count.id,
            completed_reports: completedCount,
            completion_rate: Math.round(completionRate * 100) / 100,
            average_rating: blockData._avg.rating ? Math.round(blockData._avg.rating * 100) / 100 : null,
            performance_score: this.calculatePerformanceScore(completionRate, blockData._avg.rating)
          };
        })
      );

      return enrichedBlocks
        .sort((a, b) => b.performance_score - a.performance_score)
        .slice(0, 10);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate performance score for ranking
   * @param {number} completionRate - Completion rate percentage
   * @param {number} averageRating - Average rating (0-5)
   * @returns {number} Performance score
   */
  calculatePerformanceScore(completionRate, averageRating) {
    const ratingScore = averageRating ? (averageRating / 5) * 100 : 50; // Default to 50% if no ratings
    return Math.round((completionRate * 0.6 + ratingScore * 0.4) * 100) / 100;
  }

  /**
   * Get user performance metrics
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<object>} User performance data
   */
  async getUserPerformanceMetrics(whereCondition) {
    try {
      const [coordinatorStats, fixerStats] = await Promise.all([
        // Coordinator performance
        prisma.report.groupBy({
          by: ['submitted_by'],
          where: whereCondition,
          _count: { id: true },
          _avg: { rating: true }
        }),
        
        // Fixer performance
        prisma.report.groupBy({
          by: ['assigned_to'],
          where: { 
            ...whereCondition, 
            assigned_to: { not: null },
            status: { in: ['completed', 'closed'] }
          },
          _count: { id: true },
          _avg: { rating: true }
        })
      ]);

      // Get top performers
      const topFixers = await this.getTopFixers(fixerStats);
      const activeUsers = await this.getActiveUserStats(whereCondition);

      return {
        top_fixers: topFixers,
        active_users: activeUsers,
        coordinator_activity: coordinatorStats.length,
        fixer_activity: fixerStats.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get top performing fixers
   * @param {array} fixerStats - Fixer statistics from groupBy
   * @returns {Promise<array>} Top fixers with details
   */
  async getTopFixers(fixerStats) {
    try {
      const topFixerIds = fixerStats
        .filter(stat => stat._count.id >= 5) // Minimum 5 completed jobs
        .sort((a, b) => (b._avg.rating || 0) - (a._avg.rating || 0))
        .slice(0, 5)
        .map(stat => stat.assigned_to);

      if (topFixerIds.length === 0) return [];

      const fixers = await prisma.user.findMany({
        where: { 
          id: { in: topFixerIds },
          role: { in: ['electrical_fixer', 'mechanical_fixer'] }
        },
        select: {
          id: true,
          full_name: true,
          role: true
        }
      });

      return fixers.map(fixer => {
        const stats = fixerStats.find(s => s.assigned_to === fixer.id);
        return {
          id: fixer.id,
          name: fixer.full_name,
          role: fixer.role,
          completed_jobs: stats._count.id,
          average_rating: stats._avg.rating ? Math.round(stats._avg.rating * 100) / 100 : null
        };
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active user statistics
   * @param {object} whereCondition - Base where condition
   * @returns {Promise<object>} Active user stats
   */
  async getActiveUserStats(whereCondition) {
    try {
      const [totalUsers, activeReporters, activeCoordinators, activeFixers] = await Promise.all([
        prisma.user.count({ where: { is_active: true } }),
        
        prisma.user.count({
          where: {
            is_active: true,
            role: 'reporter',
            submitted_reports: {
              some: whereCondition
            }
          }
        }),
        
        prisma.user.count({
          where: {
            is_active: true,
            role: 'coordinator'
          }
        }),
        
        prisma.user.count({
          where: {
            is_active: true,
            role: { in: ['electrical_fixer', 'mechanical_fixer'] }
          }
        })
      ]);

      return {
        total_active_users: totalUsers,
        active_reporters: activeReporters,
        active_coordinators: activeCoordinators,
        active_fixers: activeFixers
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent activity data
   * @param {number} days - Number of days to look back
   * @returns {Promise<array>} Recent activity data
   */
  async getRecentActivity(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyActivity = await prisma.report.groupBy({
        by: ['created_at'],
        where: {
          created_at: { gte: startDate }
        },
        _count: { id: true }
      });

      // Group by date (ignoring time)
      const activityByDate = {};
      dailyActivity.forEach(activity => {
        const date = activity.created_at.toISOString().split('T')[0];
        activityByDate[date] = (activityByDate[date] || 0) + activity._count.id;
      });

      // Fill in missing dates with 0
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          reports_created: activityByDate[dateStr] || 0
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enrich block data with block details
   * @param {array} reportsByBlock - Reports grouped by block
   * @returns {Promise<array>} Enriched block data
   */
  async enrichBlockData(reportsByBlock) {
    try {
      const blockIds = reportsByBlock.map(item => item.block_id);
      
      if (blockIds.length === 0) return [];

      const blocks = await prisma.block.findMany({
        where: { id: { in: blockIds } },
        select: { id: true, block_number: true, name: true }
      });

      return reportsByBlock.map(item => {
        const block = blocks.find(b => b.id === item.block_id);
        return {
          block_id: item.block_id,
          block_number: block?.block_number,
          block_name: block?.name,
          count: item._count.block_id
        };
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate comprehensive report data
   * @param {object} filters - Report filters
   * @param {string} format - Report format ('json', 'csv', 'pdf')
   * @returns {Promise<object>} Report data
   */
  async generateReport(filters = {}, format = 'json') {
    try {
      const analytics = await this.getSystemAnalytics(filters);
      
      // Get detailed report data
      const detailedData = await this.getDetailedReportData(filters);
      
      const reportData = {
        metadata: {
          generated_at: new Date().toISOString(),
          filters: filters,
          format: format
        },
        analytics: analytics,
        detailed_data: detailedData
      };

      // Format based on requested format
      switch (format) {
        case 'csv':
          return this.formatAsCSV(reportData);
        case 'pdf':
          return this.formatAsPDF(reportData);
        default:
          return reportData;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get detailed report data for exports
   * @param {object} filters - Report filters
   * @returns {Promise<object>} Detailed report data
   */
  async getDetailedReportData(filters) {
    try {
      const whereCondition = this.buildWhereCondition(filters);
      
      const reports = await prisma.report.findMany({
        where: whereCondition,
        include: {
          submitter: {
            select: { full_name: true, email: true, role: true }
          },
          assignee: {
            select: { full_name: true, email: true, role: true }
          },
          block: {
            select: { block_number: true, name: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        reports: reports.map(report => ({
          ticket_id: report.ticket_id,
          category: report.category,
          status: report.status,
          priority: report.priority,
          block_number: report.block?.block_number,
          block_name: report.block?.name,
          room_number: report.room_number,
          equipment_description: report.equipment_description,
          problem_description: report.problem_description,
          submitter_name: report.submitter.full_name,
          submitter_email: report.submitter.email,
          assignee_name: report.assignee?.full_name,
          assignee_email: report.assignee?.email,
          rating: report.rating,
          feedback: report.feedback,
          time_spent_minutes: report.time_spent_minutes,
          created_at: report.created_at,
          updated_at: report.updated_at
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Build where condition from filters
   * @param {object} filters - Filter parameters
   * @returns {object} Prisma where condition
   */
  buildWhereCondition(filters) {
    const whereCondition = {};
    
    if (filters.start_date || filters.end_date) {
      whereCondition.created_at = {};
      if (filters.start_date) whereCondition.created_at.gte = new Date(filters.start_date);
      if (filters.end_date) whereCondition.created_at.lte = new Date(filters.end_date);
    }
    
    if (filters.block_id) whereCondition.block_id = filters.block_id;
    if (filters.category) whereCondition.category = filters.category;
    if (filters.priority) whereCondition.priority = filters.priority;
    if (filters.status) whereCondition.status = filters.status;
    
    return whereCondition;
  }

  /**
   * Format report data as CSV
   * @param {object} reportData - Report data
   * @returns {string} CSV formatted data
   */
  formatAsCSV(reportData) {
    // Simple CSV formatting - in production, use a proper CSV library
    const reports = reportData.detailed_data.reports;
    
    if (reports.length === 0) {
      return 'No data available';
    }

    const headers = Object.keys(reports[0]).join(',');
    const rows = reports.map(report => 
      Object.values(report).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Format report data as PDF (placeholder)
   * @param {object} reportData - Report data
   * @returns {object} PDF generation instructions
   */
  formatAsPDF(reportData) {
    // In production, integrate with a PDF library like puppeteer or jsPDF
    return {
      format: 'pdf',
      message: 'PDF generation not implemented in this version',
      data: reportData
    };
  }

  /**
   * Get admin dashboard data
   * @returns {Promise<object>} Admin dashboard data
   */
  async getAdminDashboard() {
    try {
      const [
        systemHealth,
        recentAlerts,
        userActivity,
        systemMetrics
      ] = await Promise.all([
        this.getSystemHealth(),
        this.getRecentAlerts(),
        this.getUserActivity(),
        this.getSystemMetrics()
      ]);

      return {
        system_health: systemHealth,
        recent_alerts: recentAlerts,
        user_activity: userActivity,
        system_metrics: systemMetrics,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get system health indicators
   * @returns {Promise<object>} System health data
   */
  async getSystemHealth() {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingReports,
        overdueReports,
        systemErrors
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { is_active: true } }),
        prisma.report.count({ 
          where: { status: { notIn: ['completed', 'closed', 'rejected'] } }
        }),
        this.getOverdueReportsCount(),
        this.getSystemErrorsCount()
      ]);

      const healthScore = this.calculateHealthScore({
        activeUserRatio: activeUsers / totalUsers,
        pendingReports,
        overdueReports,
        systemErrors
      });

      return {
        health_score: healthScore,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
        metrics: {
          total_users: totalUsers,
          active_users: activeUsers,
          pending_reports: pendingReports,
          overdue_reports: overdueReports,
          system_errors: systemErrors
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get count of overdue reports based on SLA
   * @returns {Promise<number>} Count of overdue reports
   */
  async getOverdueReportsCount() {
    try {
      const now = new Date();
      const slaHours = { emergency: 2, high: 8, medium: 24, low: 72 };
      
      let overdueCount = 0;
      
      for (const [priority, hours] of Object.entries(slaHours)) {
        const cutoffTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        
        const count = await prisma.report.count({
          where: {
            priority: priority,
            status: { notIn: ['completed', 'closed', 'rejected'] },
            created_at: { lt: cutoffTime }
          }
        });
        
        overdueCount += count;
      }
      
      return overdueCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get system errors count (placeholder)
   * @returns {Promise<number>} System errors count
   */
  async getSystemErrorsCount() {
    // In production, this would check error logs or monitoring systems
    return 0;
  }

  /**
   * Calculate system health score
   * @param {object} metrics - Health metrics
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(metrics) {
    let score = 100;
    
    // Deduct points for issues
    if (metrics.activeUserRatio < 0.8) score -= 20;
    if (metrics.pendingReports > 50) score -= 15;
    if (metrics.overdueReports > 10) score -= 25;
    if (metrics.systemErrors > 0) score -= 30;
    
    return Math.max(0, score);
  }

  /**
   * Get recent system alerts
   * @returns {Promise<array>} Recent alerts
   */
  async getRecentAlerts() {
    try {
      // Get high priority notifications from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const alerts = await prisma.notification.findMany({
        where: {
          type: { in: ['warning', 'alert'] },
          created_at: { gte: yesterday }
        },
        include: {
          user: {
            select: { full_name: true, role: true }
          },
          report: {
            select: { ticket_id: true, priority: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      return alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        user_name: alert.user.full_name,
        user_role: alert.user.role,
        ticket_id: alert.report?.ticket_id,
        priority: alert.report?.priority,
        created_at: alert.created_at
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get user activity metrics
   * @returns {Promise<object>} User activity data
   */
  async getUserActivity() {
    try {
      const last24Hours = new Date();
      last24Hours.setDate(last24Hours.getDate() - 1);

      const [
        recentLogins,
        newReports,
        completedReports,
        activeUsers
      ] = await Promise.all([
        // Recent logins (would need to track login events)
        0, // Placeholder
        
        prisma.report.count({
          where: { created_at: { gte: last24Hours } }
        }),
        
        prisma.report.count({
          where: { 
            status: 'completed',
            updated_at: { gte: last24Hours }
          }
        }),
        
        prisma.user.count({
          where: {
            is_active: true,
            updated_at: { gte: last24Hours }
          }
        })
      ]);

      return {
        recent_logins: recentLogins,
        new_reports_24h: newReports,
        completed_reports_24h: completedReports,
        active_users_24h: activeUsers
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get system metrics
   * @returns {Promise<object>} System metrics
   */
  async getSystemMetrics() {
    try {
      const [
        databaseSize,
        totalPhotos,
        storageUsed
      ] = await Promise.all([
        // Database size (would need database-specific queries)
        0, // Placeholder
        
        prisma.reportPhoto.count(),
        
        // Storage used (would need filesystem queries)
        0 // Placeholder
      ]);

      return {
        database_size_mb: databaseSize,
        total_photos: totalPhotos,
        storage_used_mb: storageUsed,
        uptime_hours: process.uptime() / 3600
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AnalyticsService();