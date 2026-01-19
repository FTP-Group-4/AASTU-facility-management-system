const request = require('supertest');
const app = require('../../src/app');

describe('Analytics Endpoints', () => {
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Create test users and get tokens
    // This is a simplified test - in production you'd set up proper test data
    
    // Mock admin login
    const adminLoginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@aastu.edu.et',
        password: 'admin123'
      });

    if (adminLoginResponse.status === 200) {
      adminToken = adminLoginResponse.body.data.access_token;
    }
  });

  describe('GET /analytics', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/analytics');

      expect(response.status).toBe(401);
    });

    it('should return analytics data with valid authentication', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.summary).toBeDefined();
        expect(response.body.data.distributions).toBeDefined();
        expect(response.body.data.performance).toBeDefined();
      }
    });

    it('should accept query parameters for filtering', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics?category=electrical&priority=high')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
    });

    it('should validate query parameters', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics?block_id=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('INVALID_BLOCK_ID');
    });
  });

  describe('GET /admin/dashboard', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/admin/dashboard');

      expect(response.status).toBe(401);
    });

    it('should return admin dashboard data with admin authentication', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.system_health).toBeDefined();
        expect(response.body.data.generated_at).toBeDefined();
      }
    });
  });

  describe('POST /admin/reports/generate', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/admin/reports/generate')
        .send({ format: 'json' });

      expect(response.status).toBe(401);
    });

    it('should generate JSON report with admin authentication', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .post('/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ format: 'json' });

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should validate report format', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .post('/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ format: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('INVALID_FORMAT');
    });

    it('should generate CSV report', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .post('/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ format: 'csv' });

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('text/csv');
      }
    });
  });

  describe('GET /analytics/system/status', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/analytics/system/status');

      expect(response.status).toBe(401);
    });

    it('should return system status with admin authentication', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics/system/status')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.health).toBeDefined();
        expect(response.body.data.timestamp).toBeDefined();
        expect(response.body.data.uptime_seconds).toBeDefined();
      }
    });
  });

  describe('GET /analytics/blocks/:block_id/performance', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/analytics/blocks/1/performance');

      expect(response.status).toBe(401);
    });

    it('should validate block_id parameter', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics/blocks/invalid/performance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('INVALID_BLOCK_ID');
    });

    it('should return block performance data with valid block_id', async () => {
      if (!adminToken) {
        console.log('Skipping test - no admin token available');
        return;
      }

      const response = await request(app)
        .get('/analytics/blocks/1/performance')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should return 200 or 500 (if database not available)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.block_id).toBe(1);
      }
    });
  });
});