const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, blockSchemas, paramSchemas } = require('../middleware/validation');

// Public routes (authenticated users can view blocks)

/**
 * @route GET /blocks/:number
 * @desc Get block by block number
 * @access Private (All authenticated users)
 */
router.get('/:number', 
  authenticate,
  validate(paramSchemas.blockNumber, 'params'),
  blockController.getBlockByNumber
);

/**
 * @route GET /blocks/:id/coordinators
 * @desc Get coordinators for a specific block
 * @access Private (All authenticated users)
 */
router.get('/:id/coordinators',
  authenticate,
  validate(paramSchemas.blockId, 'params'),
  blockController.getBlockCoordinators
);

module.exports = router;