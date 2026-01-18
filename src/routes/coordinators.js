const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, paramSchemas } = require('../middleware/validation');

// Coordinator routes

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