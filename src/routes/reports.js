const express = require('express');
const reportController = require('../controllers/reportController');
const fileService = require('../services/fileService');
const { authenticate } = require('../middleware/auth');
const { validate, reportSchemas, paramSchemas } = require('../middleware/validation');

const router = express.Router();

// Configure multer for photo uploads
const upload = fileService.getMulterConfig();

/**
 * @route   POST /reports
 * @desc    Create a new maintenance report with photo uploads (1-3 photos required)
 * @access  Private (authenticated users)
 */
router.post('/',
  authenticate,
  upload.array('photos', 3), // Accept up to 3 photos with field name 'photos'
  (req, res, next) => {
    // Custom middleware to validate photo requirement
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 photo is required',
        error_code: 'VALID_002',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  (req, res, next) => {
    // Preprocessing middleware to handle flat form fields
    if (req.body.location_type) {
      req.body.location = {
        type: req.body.location_type
      };
      
      if (req.body.location_type === 'specific') {
        if (req.body.block_id) {
          req.body.location.block_id = parseInt(req.body.block_id);
        }
        if (req.body.room_number) {
          req.body.location.room_number = req.body.room_number;
        }
      } else if (req.body.location_type === 'general') {
        if (req.body.location_description) {
          req.body.location.description = req.body.location_description;
        }
      }
      
      // Clean up flat fields
      delete req.body.location_type;
      delete req.body.block_id;
      delete req.body.room_number;
      delete req.body.location_description;
    }
    
    // Handle ignore_duplicates parameter (convert string to boolean)
    if (req.body.ignore_duplicates !== undefined) {
      req.body.ignore_duplicates = req.body.ignore_duplicates === 'true' || req.body.ignore_duplicates === true;
    }
    
    next();
  },
  validate(reportSchemas.createReport),
  reportController.createReport
);

/**
 * @route   GET /reports/my
 * @desc    Get current user's reports (reporters only)
 * @access  Private (reporters only)
 */
router.get('/my',
  authenticate,
  validate(reportSchemas.getReportsQuery, 'query'),
  reportController.getMyReports
);

/**
 * @route   GET /reports
 * @desc    Get reports with filtering and pagination
 * @access  Private (role-based filtering applied)
 */
router.get('/',
  authenticate,
  validate(reportSchemas.getReportsQuery, 'query'),
  reportController.getReports
);

/**
 * @route   POST /reports/check-duplicates
 * @desc    Check for duplicate reports before submission
 * @access  Private (authenticated users)
 */
router.post('/check-duplicates',
  authenticate,
  validate(reportSchemas.checkDuplicates),
  reportController.checkDuplicates
);

/**
 * @route   GET /reports/:id
 * @desc    Get a specific report by ID or ticket ID
 * @access  Private (role-based access control)
 */
router.get('/:id',
  authenticate,
  validate(paramSchemas.reportId, 'params'),
  reportController.getReport
);

/**
 * @route   PUT /reports/:id/status
 * @desc    Update report status (coordinators, fixers, admins)
 * @access  Private (role-based permissions)
 */
router.put('/:id/status',
  authenticate,
  validate(paramSchemas.reportId, 'params'),
  validate(reportSchemas.updateReportStatus),
  reportController.updateReportStatus
);

/**
 * @route   GET /reports/:id/duplicates
 * @desc    Get duplicate reports for a specific report
 * @access  Private (role-based access control)
 */
router.get('/:id/duplicates',
  authenticate,
  validate(paramSchemas.reportId, 'params'),
  reportController.getReportDuplicates
);

/**
 * @route   DELETE /reports/:id
 * @desc    Delete a report (admin only)
 * @access  Private (admin only)
 */
router.delete('/:id',
  authenticate,
  validate(paramSchemas.reportId, 'params'),
  reportController.deleteReport
);

module.exports = router;