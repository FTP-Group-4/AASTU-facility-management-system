/**
 * Database utility tests
 */

const { checkDatabaseHealth, getDatabaseStats, verifySchema } = require('../../src/utils/database');

// Mock Prisma client for testing
jest.mock('../../src/config/database', () => ({
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  user: {
    count: jest.fn()
  },
  block: {
    count: jest.fn()
  },
  report: {
    count: jest.fn()
  }
}));

const prisma = require('../../src/config/database');

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when database connection is healthy', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      const result = await checkDatabaseHealth();
      
      expect(result).toBe(true);
      expect(prisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });

    it('should return false when database connection fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));
      
      const result = await checkDatabaseHealth();
      
      expect(result).toBe(false);
    });
  });

  describe('getDatabaseStats', () => {
    it('should return correct database statistics', async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.block.count.mockResolvedValue(100);
      prisma.report.count
        .mockResolvedValueOnce(50) // total reports
        .mockResolvedValueOnce(30) // active reports
        .mockResolvedValueOnce(20); // completed reports

      const stats = await getDatabaseStats();

      expect(stats).toEqual({
        users: 5,
        blocks: 100,
        totalReports: 50,
        activeReports: 30,
        completedReports: 20,
        completionRate: '40.00'
      });
    });

    it('should handle zero reports correctly', async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.block.count.mockResolvedValue(100);
      prisma.report.count
        .mockResolvedValueOnce(0) // total reports
        .mockResolvedValueOnce(0) // active reports
        .mockResolvedValueOnce(0); // completed reports

      const stats = await getDatabaseStats();

      expect(stats.completionRate).toBe(0);
    });
  });

  describe('verifySchema', () => {
    it('should return valid schema when all tables exist', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await verifySchema();

      expect(result.valid).toBe(true);
      expect(result.missingTables).toHaveLength(0);
      expect(Object.keys(result.tables)).toHaveLength(11);
    });

    it('should identify missing tables', async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ '?column?': 1 }]) // users table exists
        .mockRejectedValue(new Error('Table does not exist')); // other tables don't exist

      const result = await verifySchema();

      expect(result.valid).toBe(false);
      expect(result.missingTables.length).toBeGreaterThan(0);
      expect(result.tables.users.exists).toBe(true);
    });
  });
});