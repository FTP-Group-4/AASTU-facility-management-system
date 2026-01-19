const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('Admin Management Endpoints', () => {
  let adminToken;
  let testUserId;
  let testBlockId;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@aastu.edu.et', 'testuser@aastu.edu.et']
        }
      }
    });

    // Create admin user
    const adminUser = await authService.createUser({
      email: 'admin@aastu.edu.et',
      password: 'AdminPass123',
      full_name: 'Admin User',
      role: 'admin'
    });

    // Generate admin token
    adminToken = authService.generateAccessToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.coordinatorAssignment.deleteMany({
      where: {
        coordinator: {
          email: {
            in: ['admin@aastu.edu.et', 'testuser@aastu.edu.et']
          }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@aastu.edu.et', 'testuser@aastu.edu.et']
        }
      }
    });

    if (testBlockId) {
      await prisma.block.deleteMany({
        where: { id: testBlockId }
      });
    }
  });

  describe('POST /admin/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'testuser@aastu.edu.et',
        password: 'TestPass123',
        full_name: 'Test User',
        role: 'coordinator',
        phone: '+251912345678',
        department: 'Engineering'
      };

      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.role).toBe(userData.role);
      expect(response.body.data.full_name).toBe(userData.full_name);

      testUserId = response.body.data.id;
    });

    it('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid@gmail.com',
        password: 'TestPass123',
        full_name: 'Test User',
        role: 'coordinator'
      };

      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should reject non-admin access', async () => {
      // Create a regular user token
      const regularToken = authService.generateAccessToken({
        userId: 'test-id',
        email: 'regular@aastu.edu.et',
        role: 'reporter'
      });

      const userData = {
        email: 'testuser2@aastu.edu.et',
        password: 'TestPass123',
        full_name: 'Test User 2',
        role: 'coordinator'
      };

      const response = await request(app)
        .post('/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should update user role and status', async () => {
      const updateData = {
        role: 'electrical_fixer',
        is_active: false
      };

      const response = await request(app)
        .put(`/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(updateData.role);
      expect(response.body.data.is_active).toBe(updateData.is_active);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        role: 'coordinator'
      };

      const response = await request(app)
        .put('/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /admin/users', () => {
    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      
      // All returned users should have admin role
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });
  });

  describe('GET /admin/assignments', () => {
    it('should get coordinator assignment matrix', async () => {
      const response = await request(app)
        .get('/admin/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignments).toBeInstanceOf(Array);
    });
  });

  describe('Admin Configuration Endpoints', () => {
    describe('GET /admin/config', () => {
      it('should get system configuration', async () => {
        const response = await request(app)
          .get('/admin/config')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.sla_settings).toBeDefined();
        expect(response.body.data.notification_preferences).toBeDefined();
        expect(response.body.data.system_settings).toBeDefined();
      });
    });

    describe('PUT /admin/config', () => {
      it('should update system configuration', async () => {
        const configUpdate = {
          sla_settings: {
            emergency_hours: 1,
            high_hours: 6
          },
          notification_preferences: {
            email_enabled: true,
            sms_enabled: false
          },
          system_settings: {
            max_photos_per_report: 5,
            duplicate_threshold: 0.9
          }
        };

        const response = await request(app)
          .put('/admin/config')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(configUpdate)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.sla_settings.emergency_hours).toBe(1);
        expect(response.body.data.sla_settings.high_hours).toBe(6);
        expect(response.body.data.system_settings.max_photos_per_report).toBe(5);
      });

      it('should reject invalid configuration values', async () => {
        const invalidConfig = {
          sla_settings: {
            emergency_hours: 0, // Invalid: must be at least 1
            high_hours: 100     // Invalid: must be at most 72
          }
        };

        const response = await request(app)
          .put('/admin/config')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidConfig)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /admin/blocks', () => {
      it('should create block with coordinator assignments', async () => {
        const blockData = {
          block_number: 199, // Use a valid block number within range
          name: 'Test Block',
          description: 'Test block for admin functionality'
        };

        const response = await request(app)
          .post('/admin/blocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blockData);

        if (response.status !== 201) {
          console.log('Block creation failed:', response.body);
          console.log('Validation errors:', JSON.stringify(response.body.data?.errors, null, 2));
        }

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.block_number).toBe(199);
        expect(response.body.data.name).toBe('Test Block');

        testBlockId = response.body.data.id;
      });

      it('should reject duplicate block numbers', async () => {
        const blockData = {
          block_number: 199, // Same as above
          name: 'Duplicate Block'
        };

        const response = await request(app)
          .post('/admin/blocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(blockData);

        if (response.status !== 409) {
          console.log('Duplicate block test failed:', response.body);
        }

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });
    });

    describe('POST /admin/blocks/bulk-initialize', () => {
      it('should bulk initialize blocks', async () => {
        const bulkData = {
          start_number: 150,
          end_number: 152,
          prefix: 'TestBlock'
        };

        const response = await request(app)
          .post('/admin/blocks/bulk-initialize')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.created_count).toBeGreaterThan(0);
        expect(response.body.data.start_number).toBe(150);
        expect(response.body.data.end_number).toBe(152);

        // Clean up created blocks
        await prisma.block.deleteMany({
          where: {
            block_number: {
              gte: 150,
              lte: 152
            }
          }
        });
      });

      it('should reject invalid range', async () => {
        const invalidData = {
          start_number: 10,
          end_number: 5 // Invalid: start > end
        };

        const response = await request(app)
          .post('/admin/blocks/bulk-initialize')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /admin/system/health', () => {
      it('should get system health and statistics', async () => {
        const response = await request(app)
          .get('/admin/system/health')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('healthy');
        expect(response.body.data.health).toBeDefined();
        expect(response.body.data.statistics).toBeDefined();
        expect(response.body.data.statistics.users).toBeDefined();
        expect(response.body.data.statistics.reports).toBeDefined();
        expect(response.body.data.statistics.blocks).toBeDefined();
      });
    });
  });
});