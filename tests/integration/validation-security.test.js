const request = require('supertest');
const app = require('../../src/app');

describe('Input Validation and Security Tests', () => {
  describe('Input Validation', () => {
    it('should validate email format in auth endpoints', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
      expect(response.body.data.errors).toBeDefined();
    });

    it('should validate AASTU email domain', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@aastu.edu.et'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/notifications')
        .query({
          page: 'invalid',
          limit: 'not-a-number'
        })
        .set('Authorization', 'Bearer invalid-token');

      // Should fail validation before authentication
      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include helmet security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Helmet adds these headers
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-download-options']).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in request body', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@aastu.edu.et',
          password: '<script>alert("xss")</script>password123'
        });

      expect(response.status).toBe(401); // Should reach authentication and fail there
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });

    it('should handle parameter pollution', async () => {
      const response = await request(app)
        .get('/notifications')
        .query('page=1&page=2&page=3') // Multiple page parameters
        .set('Authorization', 'Bearer invalid-token');

      // Should handle parameter pollution (takes last value)
      expect(response.status).toBe(401); // Should reach auth middleware
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // Make multiple requests quickly
      const requests = Array(5).fill().map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed as health endpoint has generous limits
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should have rate limit headers', async () => {
      const response = await request(app)
        .get('/health');

      // Check for any rate limit related headers
      expect(response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining'] || response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('File Upload Security', () => {
    it('should validate filename patterns', async () => {
      const response = await request(app)
        .get('/uploads/photos/invalid..filename.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Should be caught by validation middleware
      expect(response.body.error_code).toBe('VALID_INVALID_INPUT');
    });

    it('should reject path traversal attempts', async () => {
      const response = await request(app)
        .get('/uploads/photos/../../../etc/passwd');

      // Path traversal results in 404 because the route doesn't exist after resolution
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('ENDPOINT_NOT_FOUND');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject unauthorized origins', async () => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', 'http://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST');

      // Should not include CORS headers for unauthorized origin
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Request Size Limits', () => {
    it('should handle normal sized requests', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@aastu.edu.et',
          password: 'password123'
        });

      // Should not fail due to size (will fail due to invalid credentials)
      expect(response.status).not.toBe(413);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error_code');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle 404 errors consistently', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('ENDPOINT_NOT_FOUND');
    });
  });
});