const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const bcrypt = require('bcrypt');

describe('Fixer Endpoints', () => {
  let testFixer;
  let testReporter;
  let testCoordinator;
  let testReport;
  let fixerToken;
  let coordinatorToken;

  beforeAll(async () => {
    // Clean up any existing test data - use a simpler approach
    try {
      // Delete workflow history for test users
      await prisma.$executeRaw`DELETE FROM workflow_history WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%fixertest%' OR email LIKE '%reportertest%' OR email LIKE '%coordinatortest%')`;
      
      // Delete notifications for test users
      await prisma.$executeRaw`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%fixertest%' OR email LIKE '%reportertest%' OR email LIKE '%coordinatortest%')`;
      
      // Delete reports by test users
      await prisma.$executeRaw`DELETE FROM reports WHERE submitted_by IN (SELECT id FROM users WHERE email LIKE '%fixertest%' OR email LIKE '%reportertest%' OR email LIKE '%coordinatortest%')`;
      
      // Delete test users
      await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%fixertest%' OR email LIKE '%reportertest%' OR email LIKE '%coordinatortest%'`;
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup warning:', error.message);
    }

    // Create test block if it doesn't exist
    await prisma.block.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        block_number: 1,
        name: 'Test Block 1'
      }
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    testFixer = await prisma.user.create({
      data: {
        email: 'fixertest@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test Electrical Fixer',
        role: 'electrical_fixer',
        is_active: true
      }
    });

    testReporter = await prisma.user.create({
      data: {
        email: 'reportertest@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test Reporter',
        role: 'reporter',
        is_active: true
      }
    });

    testCoordinator = await prisma.user.create({
      data: {
        email: 'coordinatortest@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test Coordinator',
        role: 'coordinator',
        is_active: true
      }
    });

    // Login to get tokens
    const fixerLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'fixertest@aastu.edu.et',
        password: 'testpass123'
      });

    const coordinatorLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'coordinatortest@aastu.edu.et',
        password: 'testpass123'
      });

    fixerToken = fixerLogin.body.data.access_token;
    coordinatorToken = coordinatorLogin.body.data.access_token;

    // Create a test report
    testReport = await prisma.report.create({
      data: {
        ticket_id: 'AASTU-FIX-20260118-0001',
        category: 'electrical',
        location_type: 'specific',
        block_id: 1,
        room_number: '101',
        equipment_description: 'Test electrical equipment',
        problem_description: 'Test problem description for fixer testing',
        status: 'assigned',
        priority: 'high',
        submitted_by: testReporter.id,
        assigned_to: testFixer.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data - delete in correct order due to foreign key constraints
    if (testFixer && testReporter && testCoordinator) {
      await prisma.workflowHistory.deleteMany({
        where: {
          user_id: { in: [testFixer.id, testReporter.id, testCoordinator.id] }
        }
      });

      await prisma.notification.deleteMany({
        where: {
          user_id: { in: [testFixer.id, testReporter.id, testCoordinator.id] }
        }
      });

      await prisma.report.deleteMany({
        where: {
          submitted_by: testReporter.id
        }
      });

      await prisma.user.deleteMany({
        where: {
          id: { in: [testFixer.id, testReporter.id, testCoordinator.id] }
        }
      });
    }

    await prisma.$disconnect();
  });

  describe('GET /fixer/dashboard', () => {
    it('should return fixer dashboard with assigned jobs', async () => {
      const response = await request(app)
        .get('/fixer/dashboard')
        .set('Authorization', `Bearer ${fixerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('assigned_jobs');
      expect(response.body.data).toHaveProperty('in_progress_jobs');
      expect(response.body.data).toHaveProperty('completed_today');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('total_assigned');
      expect(response.body.data.stats).toHaveProperty('emergency_count');
      expect(response.body.data.stats).toHaveProperty('avg_completion_time');
    }, 5000);

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/fixer/dashboard');

      expect(response.status).toBe(401);
    });

    it('should require fixer role', async () => {
      const response = await request(app)
        .get('/fixer/dashboard')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /fixer/queue', () => {
    it('should return job queue sorted by priority', async () => {
      const response = await request(app)
        .get('/fixer/queue')
        .set('Authorization', `Bearer ${fixerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('queue');
      expect(response.body.data).toHaveProperty('queue_stats');
      expect(response.body.data.queue_stats).toHaveProperty('total_waiting');
      expect(response.body.data.queue_stats).toHaveProperty('emergency_count');
      expect(response.body.data.queue_stats).toHaveProperty('oldest_waiting');
      expect(Array.isArray(response.body.data.queue)).toBe(true);
    }, 5000);

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/fixer/queue');

      expect(response.status).toBe(401);
    });

    it('should require fixer role', async () => {
      const response = await request(app)
        .get('/fixer/queue')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /fixer/jobs/:id/status', () => {
    it('should update job status to in_progress', async () => {
      const response = await request(app)
        .post(`/fixer/jobs/${testReport.id}/status`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'in_progress',
          notes: 'Starting work on this issue'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ticket_id');
      expect(response.body.data).toHaveProperty('new_status');
      expect(response.body.data.new_status).toBe('in_progress');
    });

    it('should update job status to completed with required fields', async () => {
      const response = await request(app)
        .post(`/fixer/jobs/${testReport.id}/status`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'completed',
          notes: 'Fixed the electrical issue successfully',
          parts_used: 'New electrical outlet, wiring',
          time_spent_minutes: 120
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ticket_id');
      expect(response.body.data).toHaveProperty('new_status');
      expect(response.body.data.new_status).toBe('completed');
      expect(response.body.data).toHaveProperty('notified_reporter');
      expect(response.body.data).toHaveProperty('completion_certificate_id');
    });

    it('should require completion notes when marking as completed', async () => {
      // Create another test report for this test
      const anotherReport = await prisma.report.create({
        data: {
          ticket_id: 'AASTU-FIX-20260118-0002',
          category: 'electrical',
          location_type: 'specific',
          block_id: 1,
          room_number: '102',
          equipment_description: 'Another test equipment',
          problem_description: 'Another test problem',
          status: 'in_progress',
          priority: 'medium',
          submitted_by: testReporter.id,
          assigned_to: testFixer.id
        }
      });

      const response = await request(app)
        .post(`/fixer/jobs/${anotherReport.id}/status`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'completed'
          // Missing required notes
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Clean up
      await prisma.report.delete({
        where: { id: anotherReport.id }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/fixer/jobs/${testReport.id}/status`)
        .send({
          status: 'in_progress'
        });

      expect(response.status).toBe(401);
    });

    it('should require fixer role', async () => {
      const response = await request(app)
        .post(`/fixer/jobs/${testReport.id}/status`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          status: 'in_progress'
        });

      expect(response.status).toBe(403);
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .post(`/fixer/jobs/${testReport.id}/status`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent report', async () => {
      const response = await request(app)
        .post('/fixer/jobs/non-existent-id/status')
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'in_progress'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});