const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, blockSchemas, paramSchemas } = require('../middleware/validation');

// Admin block management routes

/**
 * @route GET /admin/blocks
 * @desc Get all blocks with pagination and search
 * @access Private (Admin only)
 */
router.get('/blocks',
  authenticate,
  authorize('admin'),
  validate(blockSchemas.getBlocksQuery, 'query'),
  blockController.getAllBlocks
);

/**
 * @route GET /admin/blocks/:id
 * @desc Get block by ID with detailed information
 * @access Private (Admin only)
 */
router.get('/blocks/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.blockId, 'params'),
  blockController.getBlockById
);

/**
 * @route POST /admin/blocks
 * @desc Create new block
 * @access Private (Admin only)
 */
router.post('/blocks',
  authenticate,
  authorize('admin'),
  validate(blockSchemas.createBlock),
  blockController.createBlock
);

/**
 * @route PUT /admin/blocks/:id
 * @desc Update block information
 * @access Private (Admin only)
 */
router.put('/blocks/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.blockId, 'params'),
  validate(blockSchemas.updateBlock),
  blockController.updateBlock
);

/**
 * @route DELETE /admin/blocks/:id
 * @desc Delete block (only if no reports exist)
 * @access Private (Admin only)
 */
router.delete('/blocks/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.blockId, 'params'),
  blockController.deleteBlock
);

/**
 * @route POST /admin/blocks/initialize
 * @desc Initialize default blocks (1-100)
 * @access Private (Admin only)
 */
router.post('/blocks/initialize',
  authenticate,
  authorize('admin'),
  blockController.initializeDefaultBlocks
);

/**
 * @route POST /admin/blocks/:id/coordinators
 * @desc Assign coordinator to block
 * @access Private (Admin only)
 */
router.post('/blocks/:id/coordinators',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.blockId, 'params'),
  validate(blockSchemas.assignCoordinator),
  blockController.assignCoordinator
);

/**
 * @route DELETE /admin/blocks/:id/coordinators/:coordinatorId
 * @desc Remove coordinator assignment from block
 * @access Private (Admin only)
 */
router.delete('/blocks/:id/coordinators/:coordinatorId',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.blockIdAndCoordinatorId, 'params'),
  blockController.removeCoordinatorAssignment
);

/**
 * @route GET /admin/assignments
 * @desc Get coordinator assignment matrix
 * @access Private (Admin only)
 */
router.get('/assignments',
  authenticate,
  authorize('admin'),
  blockController.getCoordinatorAssignments
);

module.exports = router;