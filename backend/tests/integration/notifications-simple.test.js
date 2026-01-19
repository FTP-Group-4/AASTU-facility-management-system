const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');

describe('Notification System Basic Test', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%notiftest%')`;
    await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%notiftest%'`;

    // Create test user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    testUser = await prisma.user.create({
      data: {
        email: 'notiftest@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Notification Test User',
        role: 'reporter',
        is_active: true
      }
    });

    // Create auth token directly
    const authService = require('../../src/services/authService');
    authToken = authService.generateAccessToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%notiftest%')`;
    await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%notiftest%'`;
  });

  test('should get empty notifications list', async () => {
    const response = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.notifications).toEqual([]);
    expect(response.body.data.unread_count).toBe(0);
  });

  test('should require authentication', async () => {
    await request(app)
      .get('/notifications')
      .expect(401);
  });

  test('notification service should create notifications', async () => {
    const notificationService = require('../../src/services/notificationService');
    
    const notification = await notificationService.createNotification({
      user_id: testUser.id,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification'
    });

    expect(notification).toBeDefined();
    expect(notification.title).toBe('Test Notification');
    expect(notification.user_id).toBe(testUser.id);
  });
});