const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('Authentication Flow Integration', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: 'testuser@aastu.edu.et' }
    });

    // Create a test user
    const hashedPassword = await authService.hashPassword('testpassword123');
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test User',
        role: 'reporter',
        is_active: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: 'testuser@aastu.edu.et' }
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'testuser@aastu.edu.et',
          password: 'testpassword123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          token_type: 'bearer',
          expires_in: expect.any(Number),
          user: {
            id: testUser.id,
            email: 'testuser@aastu.edu.et',
            full_name: 'Test User',
            role: 'reporter',
            permissions: expect.arrayContaining(['report:create', 'report:view_own'])
          }
        }
      });

      // Store tokens for subsequent tests
      accessToken = response.body.data.access_token;
      refreshToken = response.body.data.refresh_token;
    });

    it('should validate token successfully', async () => {
      const response = await request(app)
        .get('/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            userId: testUser.id,
            email: 'testuser@aastu.edu.et',
            role: 'reporter'
          },
          expires_at: expect.any(String)
        }
      });
    });

    it('should access protected user profile endpoint', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: testUser.id,
          email: 'testuser@aastu.edu.et',
          role: 'reporter',
          full_name: 'Test User',
          created_at: expect.any(String),
          stats: expect.any(Object)
        }
      });
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          access_token: expect.any(String),
          token_type: 'bearer',
          expires_in: expect.any(Number)
        }
      });

      // Update access token
      accessToken = response.body.data.access_token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful',
        data: {
          message: 'You have been successfully logged out'
        }
      });
    });

    it('should update user profile successfully', async () => {
      // Login again to get fresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'testuser@aastu.edu.et',
          password: 'testpassword123'
        })
        .expect(200);

      const newAccessToken = loginResponse.body.data.access_token;

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          full_name: 'Updated Test User'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: testUser.id,
          email: 'testuser@aastu.edu.et',
          full_name: 'Updated Test User',
          role: 'reporter'
        }
      });
    });
  });

  describe('Role-based Access Control', () => {
    it('should deny access to admin endpoints for non-admin users', async () => {
      // Login as reporter
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'testuser@aastu.edu.et',
          password: 'testpassword123'
        })
        .expect(200);

      const reporterToken = loginResponse.body.data.access_token;

      // Try to access admin endpoint
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${reporterToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Insufficient permissions',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });
  });
});