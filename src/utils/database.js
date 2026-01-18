/**
 * Database utility functions
 */

const prisma = require('../config/database');

/**
 * Check if database connection is healthy
 * @returns {Promise<boolean>} True if connection is healthy
 */
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
async function getDatabaseStats() {
  try {
    const [
      userCount,
      blockCount,
      reportCount,
      activeReports,
      completedReports
    ] = await Promise.all([
      prisma.user.count(),
      prisma.block.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: { in: ['submitted', 'under_review', 'approved', 'assigned', 'in_progress'] } } }),
      prisma.report.count({ where: { status: 'completed' } })
    ]);

    return {
      users: userCount,
      blocks: blockCount,
      totalReports: reportCount,
      activeReports,
      completedReports,
      completionRate: reportCount > 0 ? ((completedReports / reportCount) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Failed to get database stats:', error.message);
    throw error;
  }
}

/**
 * Verify database schema integrity
 * @returns {Promise<Object>} Schema verification results
 */
async function verifySchema() {
  try {
    const tables = [
      'users', 'blocks', 'reports', 'report_photos', 'duplicate_reports',
      'completion_details', 'coordinator_assignments', 'notifications',
      'offline_queue', 'workflow_history', 'audit_logs'
    ];

    const results = {};
    
    for (const table of tables) {
      try {
        // Check if table exists by querying it
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        results[table] = { exists: true, error: null };
      } catch (error) {
        results[table] = { exists: false, error: error.message };
      }
    }

    const allTablesExist = Object.values(results).every(result => result.exists);
    
    return {
      valid: allTablesExist,
      tables: results,
      missingTables: Object.keys(results).filter(table => !results[table].exists)
    };
  } catch (error) {
    console.error('Schema verification failed:', error.message);
    throw error;
  }
}

module.exports = {
  checkDatabaseHealth,
  getDatabaseStats,
  verifySchema
};