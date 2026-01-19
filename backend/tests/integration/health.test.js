const request = require('supertest');
const app = require('../../src/app');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'AASTU Facilities Management API is running',
        data: {
          status: 'healthy',
          version: '1.0.0',
          environment: 'test'
        }
      });

      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'AASTU Facilities Management API v1.0',
        data: {
          endpoints: expect.arrayContaining([
            'GET /health - Health check',
            'POST /auth/login - User authentication'
          ])
        }
      });
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Endpoint not found',
        error_code: 'ENDPOINT_NOT_FOUND',
        data: null
      });
    });
  });
});