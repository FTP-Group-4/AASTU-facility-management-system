const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('Block Management API', () => {
  let adminToken;
  let coordinatorToken;
  let adminUser;
  let coordinatorUser;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.coordinatorAssignment.deleteMany({
      where: {
        coordinator: {
          email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
        }
      }
    });
    
    // Delete notifications first to avoid foreign key constraint violations
    await prisma.notification.deleteMany({
      where: {
        user: {
          email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
        }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
      }
    });

    // Create test users
    adminUser = await authService.createUser({
      email: 'admin@aastu.edu.et',
      password: 'AdminPass123',
      full_name: 'Test Admin',
      role: 'admin'
    });

    coordinatorUser = await authService.createUser({
      email: 'coordinator@aastu.edu.et',
      password: 'CoordPass123',
      full_name: 'Test Coordinator',
      role: 'coordinator'
    });

    // Generate tokens
    adminToken = authService.generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    coordinatorToken = authService.generateAccessToken({
      userId: coordinatorUser.id,
      email: coordinatorUser.email,
      role: coordinatorUser.role
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.coordinatorAssignment.deleteMany({
      where: {
        coordinator: {
          email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
        }
      }
    });
    
    // Delete notifications first to avoid foreign key constraint violations
    await prisma.notification.deleteMany({
      where: {
        user: {
          email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
        }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@aastu.edu.et', 'coordinator@aastu.edu.et'] }
      }
    });
  });

  describe('GET /blocks/:number', () => {
    it('should get block by number for authenticated user', async () => {
      const response = await request(app)
        .get('/blocks/1')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Block retrieved successfully'
      });
      expect(response.body.data.block_number).toBe(1);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/blocks/1')
        .expect(401);
    });

    it('should return 400 for invalid block number', async () => {
      await request(app)
        .get('/blocks/101')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(400);
    });
  });

  describe('Admin Block Management', () => {
    describe('GET /admin/blocks', () => {
      it('should get all blocks for admin', async () => {
        const response = await request(app)
          .get('/admin/blocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Blocks retrieved successfully'
        });
        expect(response.body.data.blocks).toBeInstanceOf(Array);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should return 403 for non-admin user', async () => {
        await request(app)
          .get('/admin/blocks')
          .set('Authorization', `Bearer ${coordinatorToken}`)
          .expect(403);
      });
    });

    describe('POST /admin/blocks', () => {
      it('should create new block for admin', async () => {
        const blockData = {
          block_number: 101,
          name: 'Test Block 101',
          description: 'Test block for integration testing'
        };

        const response = await request(app)
          .post('/admin/blocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blockData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Block created successfully'
        });
        expect(response.body.data.block_number).toBe(101);
        expect(response.body.data.name).toBe('Test Block 101');

        // Clean up
        await prisma.block.delete({
          where: { block_number: 101 }
        });
      });

      it('should return 400 for invalid block number', async () => {
        const blockData = {
          block_number: 300, // Invalid - should be 1-200
          name: 'Invalid Block'
        };

        await request(app)
          .post('/admin/blocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blockData)
          .expect(400);
      });
    });

    describe('Coordinator Assignment', () => {
      it('should assign coordinator to block', async () => {
        const response = await request(app)
          .post('/admin/blocks/1/coordinators')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ coordinator_id: coordinatorUser.id })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Coordinator assigned successfully'
        });
        expect(response.body.data.coordinator.id).toBe(coordinatorUser.id);
      });

      it('should get coordinator assignments', async () => {
        const response = await request(app)
          .get('/admin/assignments')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Coordinator assignments retrieved successfully'
        });
        expect(response.body.data.assignments).toBeInstanceOf(Array);
      });

      it('should remove coordinator assignment', async () => {
        await request(app)
          .delete(`/admin/blocks/1/coordinators/${coordinatorUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should assign coordinator to "Location Not Specified"', async () => {
        const response = await request(app)
          .post('/admin/blocks/general/coordinators')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ coordinator_id: coordinatorUser.id })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Coordinator assigned successfully'
        });
        expect(response.body.data.block).toBeNull();

        // Clean up
        await request(app)
          .delete(`/admin/blocks/general/coordinators/${coordinatorUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  describe('Coordinator Routes', () => {
    beforeEach(async () => {
      // Assign coordinator to block 1 for testing
      await request(app)
        .post('/admin/blocks/1/coordinators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ coordinator_id: coordinatorUser.id });
    });

    afterEach(async () => {
      // Clean up assignment
      await request(app)
        .delete(`/admin/blocks/1/coordinators/${coordinatorUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('should get coordinator blocks', async () => {
      const response = await request(app)
        .get(`/coordinators/${coordinatorUser.id}/blocks`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Coordinator blocks retrieved successfully'
      });
      expect(response.body.data.blocks).toBeInstanceOf(Array);
      expect(response.body.data.blocks.length).toBeGreaterThan(0);
    });

    it('should get block coordinators', async () => {
      const response = await request(app)
        .get('/blocks/1/coordinators')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Block coordinators retrieved successfully'
      });
      expect(response.body.data.coordinators).toBeInstanceOf(Array);
    });
  });
});