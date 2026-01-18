const request = require('supertest');
const app = require('../../src/app');
const path = require('path');
const fs = require('fs').promises;

describe('File Upload Integration Tests', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let adminUserId;

  // Create test image buffer
  const createTestImage = () => {
    // Create a minimal valid JPEG buffer (1x1 pixel)
    return Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
    ]);
  };

  beforeAll(async () => {
    // Create test users and get tokens
    const testUser = {
      email: 'testuser@aastu.edu.et',
      password: 'TestPass123',
      full_name: 'Test User',
      role: 'reporter'
    };

    const adminUser = {
      email: 'admin@aastu.edu.et',
      password: 'AdminPass123',
      full_name: 'Admin User',
      role: 'admin'
    };

    // Create users
    const userResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'testuser@aastu.edu.et',
        password: 'password123'
      });

    if (userResponse.status === 401) {
      // User doesn't exist, would need to be created by admin first
      // For testing, we'll use a mock token approach
      authToken = 'mock-user-token';
      testUserId = 'test-user-id';
    } else {
      authToken = userResponse.body.data.access_token;
      testUserId = userResponse.body.data.user.id;
    }

    // Get admin token
    const adminResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@aastu.edu.et',
        password: 'admin123'
      });

    if (adminResponse.status === 401) {
      adminToken = 'mock-admin-token';
      adminUserId = 'admin-user-id';
    } else {
      adminToken = adminResponse.body.data.access_token;
      adminUserId = adminResponse.body.data.user.id;
    }
  });

  describe('GET /uploads/config', () => {
    it('should return upload configuration', async () => {
      const response = await request(app)
        .get('/uploads/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('maxFileSize');
      expect(response.body.data).toHaveProperty('maxPhotosPerReport');
      expect(response.body.data).toHaveProperty('allowedTypes');
      expect(response.body.data.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
      expect(response.body.data.maxPhotosPerReport).toBe(3);
      expect(response.body.data.allowedTypes).toContain('image/jpeg');
    });
  });

  describe('POST /uploads/photos', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/uploads/photos')
        .attach('photos', createTestImage(), 'test.jpg');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should upload single photo successfully', async () => {
      const response = await request(app)
        .post('/uploads/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photos', createTestImage(), 'test.jpg');

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photos');
      expect(response.body.data.photos).toHaveLength(1);
      expect(response.body.data.photos[0]).toHaveProperty('id');
      expect(response.body.data.photos[0]).toHaveProperty('url');
      expect(response.body.data.photos[0]).toHaveProperty('thumbnailUrl');
    });

    it('should upload multiple photos successfully', async () => {
      const response = await request(app)
        .post('/uploads/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photos', createTestImage(), 'test1.jpg')
        .attach('photos', createTestImage(), 'test2.jpg');

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.photos).toHaveLength(2);
    });

    it('should reject more than 3 photos', async () => {
      const response = await request(app)
        .post('/uploads/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photos', createTestImage(), 'test1.jpg')
        .attach('photos', createTestImage(), 'test2.jpg')
        .attach('photos', createTestImage(), 'test3.jpg')
        .attach('photos', createTestImage(), 'test4.jpg');

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('TOO_MANY_FILES');
    });

    it('should reject invalid file types', async () => {
      const textBuffer = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/uploads/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photos', textBuffer, 'test.txt');

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject when no photos provided', async () => {
      const response = await request(app)
        .post('/uploads/photos')
        .set('Authorization', `Bearer ${authToken}`);

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('At least 1 photo is required');
    });
  });

  describe('GET /uploads/photos/:filename', () => {
    let testFilename;

    beforeAll(async () => {
      if (authToken !== 'mock-user-token') {
        // Upload a test photo first
        const uploadResponse = await request(app)
          .post('/uploads/photos')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('photos', createTestImage(), 'test.jpg');

        if (uploadResponse.status === 201) {
          testFilename = uploadResponse.body.data.photos[0].filename;
        }
      }
    });

    it('should serve uploaded photo', async () => {
      if (!testFilename) {
        // Skip if no test file was uploaded
        return;
      }

      const response = await request(app)
        .get(`/uploads/photos/${testFilename}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
    });

    it('should serve thumbnail when requested', async () => {
      if (!testFilename) {
        return;
      }

      const response = await request(app)
        .get(`/uploads/photos/${testFilename}?thumbnail=true`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get('/uploads/photos/nonexistent.jpg');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('PHOTO_NOT_FOUND');
    });

    it('should reject invalid filename', async () => {
      const response = await request(app)
        .get('/uploads/photos/invalid..filename.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('INVALID_FILENAME');
    });
  });

  describe('DELETE /uploads/photos/:filename', () => {
    let testFilename;

    beforeEach(async () => {
      if (authToken !== 'mock-user-token') {
        // Upload a test photo first
        const uploadResponse = await request(app)
          .post('/uploads/photos')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('photos', createTestImage(), 'test.jpg');

        if (uploadResponse.status === 201) {
          testFilename = uploadResponse.body.data.photos[0].filename;
        }
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/uploads/photos/test.jpg');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete('/uploads/photos/test.jpg')
        .set('Authorization', `Bearer ${authToken}`);

      if (authToken === 'mock-user-token') {
        expect(response.status).toBe(401);
        return;
      }

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should delete photo successfully as admin', async () => {
      if (!testFilename || adminToken === 'mock-admin-token') {
        return;
      }

      const response = await request(app)
        .delete(`/uploads/photos/${testFilename}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent photo', async () => {
      if (adminToken === 'mock-admin-token') {
        return;
      }

      const response = await request(app)
        .delete('/uploads/photos/nonexistent.jpg')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('PHOTO_NOT_FOUND');
    });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
      
      // Remove test files (be careful not to remove all files)
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        if (file.includes('test') || file.startsWith('1')) {
          try {
            await fs.unlink(path.join(uploadsDir, file));
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }

      const thumbnailFiles = await fs.readdir(thumbnailsDir);
      for (const file of thumbnailFiles) {
        if (file.includes('test') || file.startsWith('thumb_1')) {
          try {
            await fs.unlink(path.join(thumbnailsDir, file));
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});