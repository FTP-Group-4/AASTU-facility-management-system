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
 * @route GET /coordinator/reports
 * @access Private (Coordinators only)
 */
router.get('/reports',
  authenticate,
  authorize(['coordinator']),
  coordinatorController.getAssignedReports
);

module.exports = router;