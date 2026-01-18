const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const coordinatorController = require('../controllers/coordinatorController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, paramSchemas, bodySchemas } = require('../middleware/validation');

// Coordinator routes

/**
 * @route GET /coordinator/dashboard
 * @desc Get coordinator dashboard with assigned reports and statistics
 * @access Private (Coordinators only)
 */
router.get('/dashboard',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getDashboard
);

/**
 * @route POST /coordinator/reports/:id/review
 * @desc Review a report (approve, reject, or set under review)
 * @access Private (Coordinators only)
 */
router.post('/reports/:id/review',
  authenticate,
  authorize(['coordinator']),
  validate(paramSchemas.reportId, 'params'),
  validate(bodySchemas.reviewReport, 'body'),
  coordinatorController.reviewReport
);

/**
 * @route GET /coordinator/fixers
 * @desc Get available fixers for assignment
 * @access Private (Coordinators only)
 */
router.get('/fixers',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getAvailableFixers
);

/**
 * @route GET /coordinator/reports
 * @desc Get reports for assigned blocks with filtering
 * @access Private (Coordinators only)
 */
router.get('/reports',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getAssignedReports
);

/**
 * @route GET /coordinator/reports/pending
 * @desc Get reports requiring coordinator attention
 * @access Private (Coordinators only)
 */
router.get('/reports/pending',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getPendingReports
);

/**
 * @route GET /coordinators/:id/blocks
 * @desc Get blocks assigned to a coordinator
 * @access Private (Coordinators and Admins)
 */
router.get('/:id/blocks',
  authenticate,
  authorize(['coordinator', 'admin']),
  validate(paramSchemas.userId, 'params'),
  blockController.getCoordinatorBlocks
);

module.exports = router;