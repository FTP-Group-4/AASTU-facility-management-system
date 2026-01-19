const userService = require('../services/userService');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/response');

class UserController {
  /**
   * Get current user profile
   * GET /users/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await userService.getUserProfile(userId);

      res.status(200).json(successResponse(
        'Profile retrieved successfully',
        profile
      ));
    } catch (error) {
      console.error('Get profile error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(notFoundResponse('User profile'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve profile',
        'USER_PROFILE_ERROR'
      ));
    }
  }

  /**
   * Update current user profile
   * PUT /users/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      const updatedUser = await userService.updateUserProfile(userId, updateData);

      res.status(200).json(successResponse(
        'Profile updated successfully',
        updatedUser
      ));
    } catch (error) {
      console.error('Update profile error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(notFoundResponse('User profile'));
      }

      res.status(500).json(errorResponse(
        'Failed to update profile',
        'USER_UPDATE_ERROR'
      ));
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Check if user can access this profile
      if (currentUser.userId !== id && currentUser.role !== 'admin') {
        return res.status(403).json(forbiddenResponse('Cannot access other user profiles'));
      }

      const user = await userService.getUserById(id);

      res.status(200).json(successResponse(
        'User retrieved successfully',
        user
      ));
    } catch (error) {
      console.error('Get user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(notFoundResponse('User'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve user',
        'USER_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Create new user (admin only)
   * POST /users
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);

      res.status(201).json(successResponse(
        'User created successfully',
        newUser
      ));
    } catch (error) {
      console.error('Create user error:', error);

      if (error.message === 'Invalid AASTU email format') {
        return res.status(400).json(errorResponse(
          'Invalid email format. Please use a valid AASTU email address.',
          'USER_INVALID_EMAIL'
        ));
      }

      if (error.message === 'User already exists') {
        return res.status(409).json(errorResponse(
          'User with this email already exists',
          'USER_ALREADY_EXISTS'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to create user',
        'USER_CREATION_ERROR'
      ));
    }
  }

  /**
   * Update user (admin only)
   * PUT /users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedUser = await userService.updateUser(id, updateData);

      res.status(200).json(successResponse(
        'User updated successfully',
        updatedUser
      ));
    } catch (error) {
      console.error('Update user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(notFoundResponse('User'));
      }

      res.status(500).json(errorResponse(
        'Failed to update user',
        'USER_UPDATE_ERROR'
      ));
    }
  }

  /**
   * Get all users (admin only)
   * GET /users
   */
  async getAllUsers(req, res) {
    try {
      const filters = req.query;
      const result = await userService.getAllUsers(filters);

      res.status(200).json(successResponse(
        'Users retrieved successfully',
        result
      ));
    } catch (error) {
      console.error('Get all users error:', error);

      res.status(500).json(errorResponse(
        'Failed to retrieve users',
        'USER_RETRIEVAL_ERROR'
      ));
    }
  }
}

module.exports = new UserController();