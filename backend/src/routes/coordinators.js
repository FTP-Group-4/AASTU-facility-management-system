const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const coordinatorController = require('../controllers/coordinatorController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, paramSchemas, bodySchemas } = require('../middleware/validation');

// Coordinator routes

/**
 * @route GET /coordinator/dashboard
 * @access Private (Coordinators only)
 */
router.get('/dashboard',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getDashboard
);

/**
 * @route POST /coordinator/reports/:ticket_id/review
 * @access Private (Coordinators only)
 */
router.post('/reports/:ticket_id/review',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.reviewReport
);

/**
 * @route GET /coordinator/reports/pending
 * @access Private (Coordinators only)
 */
router.get('/reports/pending',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getPendingReports
);

/**
 * @route GET /coordinator/reports/:ticket_id
 * @access Private (Coordinators only)
 */
router.get('/reports/:ticket_id',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getReport
);

/**
 * @route GET /coordinator/pending-count
 * @access Private (Coordinators only)
 */
router.get('/pending-count',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getPendingCount
);

/**
 * @route GET /coordinator/reports
 * @access Private (Coordinators only)
 */
router.get('/reports',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getAssignedReports
);

module.exports = router;