const express = require('express');
const router = express.Router();

const blockController = require('../controllers/blockController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, blockSchemas, paramSchemas, userSchemas, authSchemas, adminSchemas, analyticsSchemas } = require('../middleware/validation');

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
 * @desc Create new block with coordinator assignments
 * @access Private (Admin only)
 */
router.post('/blocks',
  authenticate,
  authorize('admin'),
  validate(adminSchemas.createBlockAdmin),
  adminController.createBlock
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


// Admin user management routes

/**
 * @route POST /admin/users
 * @desc Create new user
 * @access Private (Admin only)
 */
router.post('/users',
  authenticate,
  authorize('admin'),
  validate(authSchemas.createUser),
  adminController.createUser // Changed from userController to adminController
);

/**
 * @route PUT /admin/users/:id
 * @desc Update user role and status
 * @access Private (Admin only)
 */
router.put('/users/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.userId, 'params'),
  validate(userSchemas.updateUser),
  adminController.updateUser // Changed from userController to adminController
);

/**
 * @route GET /admin/users
 * @desc Get all users with filtering and pagination
 * @access Private (Admin only)
 */
router.get('/users',
  authenticate,
  authorize('admin'),
  validate(userSchemas.getUsersQuery, 'query'),
  adminController.getAllUsers // Changed from userController to adminController
);

/**
 * @route GET /admin/users/:id
 * @desc Get user by ID with detailed information
 * @access Private (Admin only)
 */
router.get('/users/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.userId, 'params'),
  adminController.getUserById // Changed from userController to adminController
);

/**
 * @route DELETE /admin/users/:id
 * @desc Delete user
 * @access Private (Admin only)
 */
router.delete('/users/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.userId, 'params'),
  adminController.deleteUser
);

// Admin system configuration routes

/**
 * @route GET /admin/config
 * @desc Get current system configuration
 * @access Private (Admin only)
 */
router.get('/config',
  authenticate,
  authorize('admin'),
  adminController.getSystemConfig
);

/**
 * @route PUT /admin/config
 * @desc Update system configuration
 * @access Private (Admin only)
 */
router.put('/config',
  authenticate,
  authorize('admin'),
  validate(adminSchemas.updateSystemConfig),
  adminController.updateSystemConfig
);

/**
 * @route POST /admin/blocks/bulk-initialize
 * @desc Bulk initialize blocks with range
 * @access Private (Admin only)
 */
router.post('/blocks/bulk-initialize',
  authenticate,
  authorize('admin'),
  validate(adminSchemas.bulkInitializeBlocks),
  adminController.bulkInitializeBlocks
);

/**
 * @route GET /admin/system/health
 * @desc Get system health and statistics
 * @access Private (Admin only)
 */
router.get('/system/health',
  authenticate,
  authorize('admin'),
  adminController.getSystemHealth
);

// Admin analytics and dashboard routes

/**
 * @route GET /admin/dashboard
 * @desc Get admin dashboard with system health and metrics
 * @access Private (Admin only)
 */
router.get('/dashboard',
  authenticate,
  authorize('admin'),
  adminController.getDashboard
);

/**
 * @route GET /admin/assignments
 * @desc Get coordinator assignment matrix
 * @access Private (Admin only)
 */
router.get('/assignments',
  authenticate,
  authorize('admin'),
  adminController.getAssignments
);

/**
 * @route POST /admin/reports/generate
 * @desc Generate and download system reports
 * @access Private (Admin only)
 */
router.post('/reports/generate',
  authenticate,
  authorize('admin'),
  validate(analyticsSchemas.generateReportBody),
  adminController.generateReport
);

/**
 * @route GET /admin/reports
 * @desc Get all reports with filtering and pagination
 * @access Private (Admin only)
 */
router.get('/reports',
  authenticate,
  authorize('admin'),
  adminController.getAllReports
);

/**
 * @route GET /admin/reports/generate
 * @desc Handle GET requests gracefully (405 Method Not Allowed)
 * @access Private (Admin only)
 */
router.get('/reports/generate',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Please use POST to generate reports.',
      error_code: 'METHOD_NOT_ALLOWED'
    });
  }
);

module.exports = router;