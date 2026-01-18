const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Endpoints', () => {
  describe('POST /auth/login', () => {
    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid@gmail.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error_code: 'VALID_INVALID_INPUT'
      });

      expect(response.body.data.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('AASTU email address')
          })
        ])
      );
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@aastu.edu.et'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error_code: 'VALID_INVALID_INPUT'
      });
    });

    it('should reject login with short password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@aastu.edu.et',
          password: '123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error_code: 'VALID_INVALID_INPUT'
      });
    });

    it('should handle non-existent user gracefully', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@aastu.edu.et',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid email or password',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        error_code: 'VALID_INVALID_INPUT'
      });
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-token'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid refresh token. Please login again.',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid token',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  describe('GET /auth/validate', () => {
    it('should reject validation without authentication', async () => {
      const response = await request(app)
        .get('/auth/validate')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Access token required',
        error_code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    });
  });
});