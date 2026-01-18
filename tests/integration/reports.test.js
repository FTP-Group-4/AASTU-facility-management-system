const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const authService = require('../../src/services/authService');
const fileService = require('../../src/services/fileService');

// Mock the file service for testing
jest.mock('../../src/services/fileService', () => ({
  getMulterConfig: jest.fn(() => require('multer')({ storage: require('multer').memoryStorage() })),
  validatePhotoUpload: jest.fn(() => ({ valid: true })),
  processMultiplePhotos: jest.fn(() => Promise.resolve([
    {
      filename: 'test-photo.jpg',
      originalName: 'test-image.jpg',
      url: '/uploads/test-photo.jpg',
      size: 1024,
      mimetype: 'image/jpeg',
      thumbnailUrl: '/uploads/thumbnails/thumb_test-photo.jpg'
    }
  ]))
}));

describe('Report Management Endpoints', () => {
  let authToken;
  let testUserId;
  let testBlockId;

  beforeAll(async () => {
    // Create a test user with proper password hash
    const passwordHash = await authService.hashPassword('password123');
    const testUser = await prisma.user.create({
      data: {
        email: 'test.reporter@aastu.edu.et',
        password_hash: passwordHash,
        full_name: 'Test Reporter',
        role: 'reporter'
      }
    });
    testUserId = testUser.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.reporter@aastu.edu.et',
        password: 'password123'
      });

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.access_token;
    } else {
      throw new Error('Failed to authenticate test user');
    }

    // Try to find existing block 1 or create a unique test block
    let testBlock = await prisma.block.findFirst({
      where: { block_number: 1 }
    });

    if (!testBlock) {
      testBlock = await prisma.block.create({
        data: {
          block_number: 1,
          name: 'Test Block 1'
        }
      });
    }
    testBlockId = testBlock.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.workflowHistory.deleteMany({
        where: { user_id: testUserId }
      });
      await prisma.reportPhoto.deleteMany({});
      await prisma.report.deleteMany({
        where: { submitted_by: testUserId }
      });
      await prisma.user.delete({
        where: { id: testUserId }
      });
      // Don't delete the block as it might be used by other tests
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
    await prisma.$disconnect();
  });

  describe('POST /reports', () => {
    it('should create a report with specific location and photos', async () => {
      const reportData = {
        category: 'electrical',
        location: {
          type: 'specific',
          block_id: 1,
          room_number: '101'
        },
        equipment_description: 'Broken light switch',
        problem_description: 'The light switch in room 101 is not working properly'
      };

      // Simple test buffer
      const testImageBuffer = Buffer.from('test-image-data');

      const response = await request(app)
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', reportData.category)
        .field('location[type]', reportData.location.type)
        .field('location[block_id]', reportData.location.block_id.toString())
        .field('location[room_number]', reportData.location.room_number)
        .field('equipment_description', reportData.equipment_description)
        .field('problem_description', reportData.problem_description)
        .attach('photos', testImageBuffer, 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toMatch(/^AASTU-FIX-\d{8}-\d{4}$/);
      expect(response.body.data.status).toBe('submitted');
    });

    it('should create a report with general location', async () => {
      const reportData = {
        category: 'mechanical',
        location: {
          type: 'general',
          description: 'Near the main library entrance'
        },
        equipment_description: 'Water fountain',
        problem_description: 'Water fountain is not dispensing water properly'
      };

      const testImageBuffer = Buffer.from('test-image-data');

      const response = await request(app)
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', reportData.category)
        .field('location[type]', reportData.location.type)
        .field('location[description]', reportData.location.description)
        .field('equipment_description', reportData.equipment_description)
        .field('problem_description', reportData.problem_description)
        .attach('photos', testImageBuffer, 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toMatch(/^AASTU-FIX-\d{8}-\d{4}$/);
    });

    it('should reject report without photos', async () => {
      const reportData = {
        category: 'electrical',
        location: {
          type: 'specific',
          block_id: 1
        },
        equipment_description: 'Broken outlet',
        problem_description: 'Electrical outlet is not working'
      };

      const response = await request(app)
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALID_002');
    });

    it('should reject report with invalid block number', async () => {
      const testImageBuffer = Buffer.from('test-image-data');

      const response = await request(app)
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'electrical')
        .field('location[type]', 'specific')
        .field('location[block_id]', '150') // Invalid block number
        .field('equipment_description', 'Broken outlet')
        .field('problem_description', 'Electrical outlet is not working')
        .attach('photos', testImageBuffer, 'test-image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
    });

    it('should require authentication', async () => {
      const testImageBuffer = Buffer.from('test-image-data');

      const response = await request(app)
        .post('/reports')
        .field('category', 'electrical')
        .field('location[type]', 'specific')
        .field('location[block_id]', '1')
        .field('equipment_description', 'Test equipment')
        .field('problem_description', 'Test problem description')
        .attach('photos', testImageBuffer, 'test-image.jpg');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /reports/my', () => {
    it('should get reports for authenticated reporter', async () => {
      const response = await request(app)
        .get('/reports/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.reports)).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('POST /reports/check-duplicates', () => {
    it('should check for duplicates', async () => {
      const duplicateData = {
        category: 'electrical',
        location: {
          type: 'specific',
          block_id: 1
        },
        equipment_description: 'Broken light switch'
      };

      const response = await request(app)
        .post('/reports/check-duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.has_duplicates).toBeDefined();
      expect(Array.isArray(response.body.data.duplicates)).toBe(true);
    });
  });
});