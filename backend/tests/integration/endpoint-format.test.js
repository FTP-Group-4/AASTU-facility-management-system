const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const authService = require('../../src/services/authService');

describe('Endpoint Response Format Compliance', () => {
  let testUser;
  let accessToken;

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: 'formattest@aastu.edu.et' }
    });

    // Create a test user
    const hashedPassword = await authService.hashPassword('testpassword123');
    testUser = await prisma.user.create({
      data: {
        email: 'formattest@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Format Test User',
        phone: '+251911223344',
        department: 'Computer Science',
        role: 'reporter',
        is_active: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: 'formattest@aastu.edu.et' }
    });
  });

  describe('Authentication Endpoints Format', () => {
    it('POST /auth/login should match specification format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'formattest@aastu.edu.et',
          password: 'testpassword123'
        })
        .expect(200);

      // Verify exact response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('error_code', null);
      expect(response.body).toHaveProperty('timestamp');

      // Verify data structure matches specification
      const { data } = response.body;
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
      expect(data).toHaveProperty('token_type', 'bearer');
      expect(data).toHaveProperty('expires_in');
      expect(data).toHaveProperty('user');

      // Verify user object structure
      const { user } = data;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', 'formattest@aastu.edu.et');
      expect(user).toHaveProperty('role', 'reporter');
      expect(user).toHaveProperty('full_name', 'Format Test User');
      expect(user).toHaveProperty('permissions');
      expect(Array.isArray(user.permissions)).toBe(true);

      // Store token for subsequent tests
      accessToken = data.access_token;
    });

    it('POST /auth/refresh should match specification format', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'formattest@aastu.edu.et',
          password: 'testpassword123'
        });

      const refreshToken = loginResponse.body.data.refresh_token;

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('error_code', null);
      expect(response.body).toHaveProperty('timestamp');

      // Verify data structure
      const { data } = response.body;
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('token_type', 'bearer');
      expect(data).toHaveProperty('expires_in');
    });
  });

  describe('User Profile Endpoints Format', () => {
    it('GET /users/profile should match specification format for reporter', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.body).toHaveProperty('error_code', null);
      expect(response.body).toHaveProperty('timestamp');

      // Verify data structure matches specification for reporter
      const { data } = response.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email', 'formattest@aastu.edu.et');
      expect(data).toHaveProperty('role', 'reporter');
      expect(data).toHaveProperty('full_name', 'Format Test User');
      expect(data).toHaveProperty('phone', '+251911223344');
      expect(data).toHaveProperty('department', 'Computer Science');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('stats');

      // Verify stats structure for reporter
      const { stats } = data;
      expect(stats).toHaveProperty('reports_submitted');
      expect(stats).toHaveProperty('reports_pending');
      expect(stats).toHaveProperty('avg_rating_given');
    });

    it('PUT /users/profile should match specification format', async () => {
      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          full_name: 'Updated Format Test User',
          phone: '+251922334455'
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body).toHaveProperty('error_code', null);
      expect(response.body).toHaveProperty('timestamp');

      // Verify updated data
      const { data } = response.body;
      expect(data).toHaveProperty('full_name', 'Updated Format Test User');
      expect(data).toHaveProperty('phone', '+251922334455');
    });
  });

  describe('Error Response Format', () => {
    it('should return proper error format for invalid login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@aastu.edu.et',
          password: 'wrongpassword'
        })
        .expect(401);

      // Verify error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error_code');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'short'
        })
        .expect(400);

      // Verify validation error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('error_code', 'VALID_INVALID_INPUT');
      expect(response.body).toHaveProperty('timestamp');

      // Verify validation error data structure
      const { data } = response.body;
      expect(data).toHaveProperty('errors');
      expect(Array.isArray(data.errors)).toBe(true);
    });
  });
});