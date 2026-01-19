const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /auth/login
 * @desc    User login with AASTU email and password
 * @access  Public
 */
router.post('/login', 
  validate(authSchemas.login),
  authController.login
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  validate(authSchemas.refreshToken),
  authController.refresh
);

/**
 * @route   POST /auth/logout
 * @desc    User logout (invalidate token)
 * @access  Private
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /auth/validate
 * @desc    Validate current access token
 * @access  Private
 */
router.get('/validate',
  authenticate,
  authController.validateToken
);

module.exports = router;