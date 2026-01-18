const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userSchemas, paramSchemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /users/profile
 * @desc    Get current user profile with role-specific data
 * @access  Private
 */
router.get('/profile',
  authenticate,
  userController.getProfile
);

/**
 * @route   PUT /users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validate(userSchemas.updateProfile),
  userController.updateProfile
);

/**
 * @route   GET /users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize('admin'),
  validate(userSchemas.getUsersQuery, 'query'),
  userController.getAllUsers
);

/**
 * @route   POST /users
 * @desc    Create new user (admin only)
 * @access  Private (Admin)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validate(userSchemas.createUser),
  userController.createUser
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID (admin or own profile)
 * @access  Private
 */
router.get('/:id',
  authenticate,
  validate(paramSchemas.userId, 'params'),
  userController.getUserById
);

/**
 * @route   PUT /users/:id
 * @desc    Update user (admin only)
 * @access  Private (Admin)
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  validate(paramSchemas.userId, 'params'),
  validate(userSchemas.updateUser),
  userController.updateUser
);

module.exports = router;