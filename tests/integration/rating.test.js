const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock the file service for testing
jest.mock('../../src/services/fileService', () => ({
  getMulterConfig: jest.fn(() => require('multer')({ storage: require('multer').memoryStorage() })),
  validatePhotoUpload: jest.fn(() => ({ valid: true })),
  processMultiplePhotos: jest.fn(() => Promise.resolve([
    {
      filename: 'test-photo.jpg',
      originalName: 'test.jpg',
      url: '/uploads/test-photo.jpg',
      size: 1024,
      mimetype: 'image/jpeg',
      thumbnailUrl: '/uploads/thumbnails/thumb_test-photo.jpg'
    }
  ]))
}));

describe('Rating and Feedback System', () => {
  let reporterToken;
  let fixerToken;
  let reporterId;
  let fixerId;
  let reportId;
  let ticketId;

  beforeAll(async () => {
    // Clean up existing test data in correct order
    // First delete all dependent records for test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['reporter@aastu.edu.et', 'fixer@aastu.edu.et']
        }
      }
    });

    if (testUsers.length > 0) {
      const userIds = testUsers.map(u => u.id);
      
      // Delete notifications
      await prisma.notification.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete workflow history
      await prisma.workflowHistory.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete completion details for reports submitted by test users
      await prisma.completionDetail.deleteMany({
        where: {
          report: {
            submitted_by: { in: userIds }
          }
        }
      });

      // Delete report photos for reports submitted by test users
      await prisma.reportPhoto.deleteMany({
        where: {
          report: {
            submitted_by: { in: userIds }
          }
        }
      });

      // Delete reports
      await prisma.report.deleteMany({
        where: {
          OR: [
            { submitted_by: { in: userIds } },
            { assigned_to: { in: userIds } }
          ]
        }
      });

      // Finally delete users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['reporter@aastu.edu.et', 'fixer@aastu.edu.et']
          }
        }
      });
    }

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const reporter = await prisma.user.create({
      data: {
        email: 'reporter@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test Reporter',
        role: 'reporter',
        is_active: true
      }
    });
    reporterId = reporter.id;

    const fixer = await prisma.user.create({
      data: {
        email: 'fixer@aastu.edu.et',
        password_hash: hashedPassword,
        full_name: 'Test Fixer',
        role: 'electrical_fixer',
        is_active: true
      }
    });
    fixerId = fixer.id;

    // Generate tokens with proper issuer and audience
    reporterToken = jwt.sign(
      { userId: reporterId, role: 'reporter' },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '1h',
        issuer: 'aastu-facilities-api',
        audience: 'aastu-facilities-client'
      }
    );

    fixerToken = jwt.sign(
      { userId: fixerId, role: 'electrical_fixer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '1h',
        issuer: 'aastu-facilities-api',
        audience: 'aastu-facilities-client'
      }
    );

    // Ensure block 1 exists
    await prisma.block.upsert({
      where: { block_number: 1 },
      update: {},
      create: {
        block_number: 1,
        name: 'Test Block 1'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order (delete dependent records first)
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['reporter@aastu.edu.et', 'fixer@aastu.edu.et']
        }
      }
    });

    if (testUsers.length > 0) {
      const userIds = testUsers.map(u => u.id);
      
      // Delete notifications
      await prisma.notification.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete workflow history
      await prisma.workflowHistory.deleteMany({
        where: { user_id: { in: userIds } }
      });

      // Delete completion details for reports submitted by test users
      await prisma.completionDetail.deleteMany({
        where: {
          report: {
            submitted_by: { in: userIds }
          }
        }
      });

      // Delete report photos for reports submitted by test users
      await prisma.reportPhoto.deleteMany({
        where: {
          report: {
            submitted_by: { in: userIds }
          }
        }
      });

      // Delete reports
      await prisma.report.deleteMany({
        where: {
          OR: [
            { submitted_by: { in: userIds } },
            { assigned_to: { in: userIds } }
          ]
        }
      });

      // Finally delete users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['reporter@aastu.edu.et', 'fixer@aastu.edu.et']
          }
        }
      });
    }
  });

  describe('Report Completion and Rating Flow', () => {
    test('should create a report and complete the full workflow to rating', async () => {
      // Step 1: Create a report
      const reportData = {
        category: 'electrical',
        location_type: 'specific',
        block_id: 1,
        room_number: '101',
        equipment_description: 'Broken light switch',
        problem_description: 'The light switch in room 101 is not working properly'
      };

      const createResponse = await request(app)
        .post('/reports')
        .set('Authorization', `Bearer ${reporterToken}`)
        .field('category', reportData.category)
        .field('location_type', reportData.location_type)
        .field('block_id', reportData.block_id)
        .field('room_number', reportData.room_number)
        .field('equipment_description', reportData.equipment_description)
        .field('problem_description', reportData.problem_description)
        .attach('photos', Buffer.from('fake-image-data'), 'test.jpg');

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      
      ticketId = createResponse.body.data.ticket_id;
      
      // Get report ID from ticket ID
      const report = await prisma.report.findUnique({
        where: { ticket_id: ticketId }
      });
      reportId = report.id;

      // Step 2: Transition through workflow states to completed
      // submitted -> under_review
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'under_review' }
      });

      // under_review -> approved (with priority)
      await prisma.report.update({
        where: { id: reportId },
        data: { 
          status: 'approved',
          priority: 'medium'
        }
      });

      // approved -> assigned
      await prisma.report.update({
        where: { id: reportId },
        data: { 
          status: 'assigned',
          assigned_to: fixerId
        }
      });

      // assigned -> in_progress
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'in_progress' }
      });

      // in_progress -> completed (with completion details)
      const completionResponse = await request(app)
        .post(`/fixer/jobs/${reportId}/status`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          status: 'completed',
          notes: 'Replaced the faulty light switch with a new one',
          parts_used: 'Light switch model XYZ-123',
          time_spent_minutes: 45
        });

      expect(completionResponse.status).toBe(200);
      expect(completionResponse.body.success).toBe(true);
      expect(completionResponse.body.data.new_status).toBe('completed');

      // Verify completion details were created
      const completionDetails = await prisma.completionDetail.findUnique({
        where: { report_id: reportId }
      });
      expect(completionDetails).toBeTruthy();
      expect(completionDetails.completion_notes).toBe('Replaced the faulty light switch with a new one');
      expect(completionDetails.parts_used).toBe('Light switch model XYZ-123');
      expect(completionDetails.time_spent_minutes).toBe(45);
    });

    test('should allow reporter to rate completed report with high rating', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${reportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 5,
          comment: 'Excellent work! The light switch is working perfectly now.'
        });

      expect(ratingResponse.status).toBe(200);
      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.new_status).toBe('closed');
      expect(ratingResponse.body.data.rating).toBe(5);

      // Verify report was updated with rating
      const updatedReport = await prisma.report.findUnique({
        where: { id: reportId }
      });
      expect(updatedReport.rating).toBe(5);
      expect(updatedReport.feedback).toBe('Excellent work! The light switch is working perfectly now.');
      expect(updatedReport.status).toBe('closed');

      // Verify workflow history was created
      const workflowHistory = await prisma.workflowHistory.findFirst({
        where: {
          report_id: reportId,
          action: 'rate'
        }
      });
      expect(workflowHistory).toBeTruthy();
      expect(workflowHistory.from_status).toBe('completed');
      expect(workflowHistory.to_status).toBe('closed');
    });

    test('should not allow rating the same report twice', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${reportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 4,
          comment: 'Trying to rate again'
        });

      expect(ratingResponse.status).toBe(400);
      expect(ratingResponse.body.success).toBe(false);
      expect(ratingResponse.body.message).toContain('You can only rate completed reports');
    });
  });

  describe('Rating Validation', () => {
    let testReportId;

    beforeEach(async () => {
      // Create a completed report for testing
      const report = await prisma.report.create({
        data: {
          ticket_id: `AASTU-FIX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-9999`,
          category: 'electrical',
          location_type: 'specific',
          block_id: 1,
          room_number: '102',
          equipment_description: 'Test equipment',
          problem_description: 'Test problem for rating validation',
          status: 'completed',
          submitted_by: reporterId,
          assigned_to: fixerId
        }
      });
      testReportId = report.id;
    });

    afterEach(async () => {
      if (testReportId) {
        await prisma.workflowHistory.deleteMany({
          where: { report_id: testReportId }
        });
        await prisma.report.deleteMany({
          where: { id: testReportId }
        });
      }
    });

    test('should require comment for low ratings (0-3)', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 2
          // No comment provided
        });

      expect(ratingResponse.status).toBe(400);
      expect(ratingResponse.body.success).toBe(false);
      expect(ratingResponse.body.message).toBe('Validation failed');
      expect(ratingResponse.body.data.errors).toBeDefined();
      expect(ratingResponse.body.data.errors.some(err => err.message.includes('Comment is required'))).toBe(true);
    });

    test('should require minimum comment length for low ratings', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 1,
          comment: 'Too short'
        });

      expect(ratingResponse.status).toBe(400);
      expect(ratingResponse.body.success).toBe(false);
      expect(ratingResponse.body.message).toBe('Validation failed');
      expect(ratingResponse.body.data.errors).toBeDefined();
      expect(ratingResponse.body.data.errors.some(err => err.message.includes('at least 20 characters'))).toBe(true);
    });

    test('should allow optional comment for high ratings (4-5)', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 4
          // No comment - should be allowed
        });

      expect(ratingResponse.status).toBe(200);
      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.new_status).toBe('closed');
    });

    test('should reopen report for very low rating (0-1)', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 0,
          comment: 'The problem is still not fixed and actually got worse'
        });

      expect(ratingResponse.status).toBe(200);
      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.new_status).toBe('reopened');
    });

    test('should send for coordinator review for medium ratings (2-3)', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 3,
          comment: 'The work was done but there are some issues that need attention'
        });

      expect(ratingResponse.status).toBe(200);
      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.new_status).toBe('under_review');
    });

    test('should handle mark_still_broken flag', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          rating: 4,
          comment: 'Good work but issue persists',
          mark_still_broken: true
        });

      expect(ratingResponse.status).toBe(200);
      expect(ratingResponse.body.success).toBe(true);
      expect(ratingResponse.body.data.new_status).toBe('reopened');
    });
  });

  describe('Rating Access Control', () => {
    let otherReporterId;
    let otherReporterToken;
    let testReportId;

    beforeAll(async () => {
      // Create another reporter
      const hashedPassword = await bcrypt.hash('password123', 10);
      const otherReporter = await prisma.user.create({
        data: {
          email: 'other-reporter@aastu.edu.et',
          password_hash: hashedPassword,
          full_name: 'Other Reporter',
          role: 'reporter',
          is_active: true
        }
      });
      otherReporterId = otherReporter.id;

      otherReporterToken = jwt.sign(
        { userId: otherReporterId, role: 'reporter' },
        process.env.JWT_SECRET || 'your-secret-key',
        { 
          expiresIn: '1h',
          issuer: 'aastu-facilities-api',
          audience: 'aastu-facilities-client'
        }
      );
    });

    beforeEach(async () => {
      // Create a completed report for the original reporter
      const report = await prisma.report.create({
        data: {
          ticket_id: `AASTU-FIX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-8888`,
          category: 'electrical',
          location_type: 'specific',
          block_id: 1,
          room_number: '103',
          equipment_description: 'Test equipment for access control',
          problem_description: 'Test problem for access control',
          status: 'completed',
          submitted_by: reporterId,
          assigned_to: fixerId
        }
      });
      testReportId = report.id;
    });

    afterEach(async () => {
      if (testReportId) {
        await prisma.workflowHistory.deleteMany({
          where: { report_id: testReportId }
        });
        await prisma.report.deleteMany({
          where: { id: testReportId }
        });
      }
    });

    afterAll(async () => {
      // Delete notifications for test user
      if (otherReporterId) {
        await prisma.notification.deleteMany({
          where: { user_id: otherReporterId }
        });
        
        // Delete any reports by this user
        await prisma.report.deleteMany({
          where: { submitted_by: otherReporterId }
        });
        
        await prisma.user.deleteMany({
          where: { email: 'other-reporter@aastu.edu.et' }
        });
      }
    });

    test('should not allow other reporters to rate someone else\'s report', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${otherReporterToken}`)
        .send({
          rating: 5,
          comment: 'Trying to rate someone else\'s report'
        });

      expect(ratingResponse.status).toBe(400);
      expect(ratingResponse.body.success).toBe(false);
      expect(ratingResponse.body.message).toContain('only rate your own');
    });

    test('should not allow non-reporters to rate reports', async () => {
      const ratingResponse = await request(app)
        .post(`/reports/${testReportId}/rate`)
        .set('Authorization', `Bearer ${fixerToken}`)
        .send({
          rating: 5,
          comment: 'Fixer trying to rate'
        });

      expect(ratingResponse.status).toBe(403);
      expect(ratingResponse.body.success).toBe(false);
      expect(ratingResponse.body.message).toContain('Only reporters can rate');
    });
  });

  describe('Completion Details Endpoints', () => {
    let testReportId;

    beforeEach(async () => {
      // Create a completed report with completion details
      const report = await prisma.report.create({
        data: {
          ticket_id: `AASTU-FIX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-7777`,
          category: 'electrical',
          location_type: 'specific',
          block_id: 1,
          room_number: '104',
          equipment_description: 'Test equipment for completion details',
          problem_description: 'Test problem for completion details',
          status: 'completed',
          submitted_by: reporterId,
          assigned_to: fixerId,
          completion_notes: 'Test completion notes',
          parts_used: 'Test parts',
          time_spent_minutes: 30
        }
      });
      testReportId = report.id;

      // Create completion details
      await prisma.completionDetail.create({
        data: {
          report_id: testReportId,
          completed_by: fixerId,
          completion_notes: 'Detailed completion notes',
          parts_used: 'Specific parts used',
          time_spent_minutes: 30
        }
      });
    });

    afterEach(async () => {
      if (testReportId) {
        await prisma.completionDetail.deleteMany({
          where: { report_id: testReportId }
        });
        await prisma.workflowHistory.deleteMany({
          where: { report_id: testReportId }
        });
        await prisma.report.deleteMany({
          where: { id: testReportId }
        });
      }
    });

    test('should get completion details for a report', async () => {
      const response = await request(app)
        .get(`/reports/${testReportId}/completion`)
        .set('Authorization', `Bearer ${reporterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completion_details).toBeTruthy();
      expect(response.body.data.completion_details.completion_notes).toBe('Detailed completion notes');
      expect(response.body.data.completion_details.parts_used).toBe('Specific parts used');
      expect(response.body.data.completion_details.time_spent_minutes).toBe(30);
    });

    test('should check if report can be rated', async () => {
      const response = await request(app)
        .get(`/reports/${testReportId}/can-rate`)
        .set('Authorization', `Bearer ${reporterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.can_rate).toBe(true);
    });
  });
});