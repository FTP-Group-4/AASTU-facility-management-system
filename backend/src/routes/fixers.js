const express = require('express');
const router = express.Router();

const fixerController = require('../controllers/fixerController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, paramSchemas, bodySchemas } = require('../middleware/validation');

// Fixer routes

/**
 * @route GET /fixer/dashboard
 * @desc Get fixer dashboard with assigned jobs and statistics
 * @access Private (Fixers only)
 */
router.get('/dashboard',
  authenticate,
  authorize(['electrical_fixer', 'mechanical_fixer']),
  fixerController.getDashboard
);

/**
 * @route GET /fixer/queue
 * @desc Get job queue sorted by priority
 * @access Private (Fixers only)
 */
router.get('/queue',
  authenticate,
  authorize(['electrical_fixer', 'mechanical_fixer']),
  fixerController.getJobQueue
);

/**
 * @route POST /fixer/jobs/:id/status
 * @desc Update job status (assigned, in_progress, completed)
 * @access Private (Fixers only)
 */
router.post('/jobs/:id/status',
  (req, res, next) => {
    console.log('=== FIXER ROUTE HIT ===', req.params.id);
    next();
  },
  authenticate,
  authorize(['electrical_fixer', 'mechanical_fixer']),
  validate(paramSchemas.reportId, 'params'),
  validate(bodySchemas.updateJobStatus, 'body'),
  fixerController.updateJobStatus
);

module.exports = router;