const authService = require('../services/authService');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response');

/**
 * Get role-based permissions
 * @param {string} role - User role
 * @returns {array} Array of permissions
 */
const getRolePermissions = (role) => {
  const permissions = {
    reporter: ['report:create', 'report:view_own', 'report:rate'],
    coordinator: ['report:view_assigned', 'report:approve', 'report:reject', 'report:create'],
    electrical_fixer: ['report:view_assigned', 'report:update_status', 'report:complete'],
    mechanical_fixer: ['report:view_assigned', 'report:update_status', 'report:complete'],
    admin: ['*']
  };
  
  return permissions[role] || [];
};

class AuthController {
  /**
   * User login endpoint
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password, device_id } = req.body;

      const authResult = await authService.authenticateUser(email, password);

      // Log successful login (for audit purposes)
      console.log(`User login successful: ${email} at ${new Date().toISOString()}`);

      res.status(200).json(successResponse(
        'Login successful',
        {
          access_token: authResult.accessToken,
          refresh_token: authResult.refreshToken,
          token_type: 'bearer',
          expires_in: authResult.expiresIn,
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            role: authResult.user.role,
            full_name: authResult.user.full_name,
            permissions: getRolePermissions(authResult.user.role)
          }
        }
      ));
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific authentication errors
      if (error.message === 'Invalid AASTU email format') {
        return res.status(400).json(errorResponse(
          'Invalid email format. Please use your AASTU email address.',
          'AUTH_INVALID_EMAIL'
        ));
      }

      if (error.message === 'Invalid credentials') {
        return res.status(401).json(unauthorizedResponse('Invalid email or password'));
      }

      if (error.message === 'Account is deactivated') {
        return res.status(401).json(unauthorizedResponse('Your account has been deactivated. Please contact administrator.'));
      }

      // Generic error for security
      res.status(500).json(errorResponse(
        'Login failed. Please try again.',
        'AUTH_LOGIN_FAILED'
      ));
    }
  }

  /**
   * Token refresh endpoint
   * POST /auth/refresh
   */
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json(errorResponse(
          'Refresh token is required',
          'AUTH_MISSING_REFRESH_TOKEN'
        ));
      }

      const result = await authService.refreshAccessToken(refresh_token);

      res.status(200).json(successResponse(
        'Token refreshed successfully',
        {
          access_token: result.accessToken,
          token_type: 'bearer',
          expires_in: result.expiresIn
        }
      ));
    } catch (error) {
      console.error('Token refresh error:', error);

      if (error.message === 'Refresh token expired') {
        return res.status(401).json(unauthorizedResponse('Refresh token expired. Please login again.'));
      }

      if (error.message === 'Invalid refresh token') {
        return res.status(401).json(unauthorizedResponse('Invalid refresh token. Please login again.'));
      }

      if (error.message === 'User not found or inactive') {
        return res.status(401).json(unauthorizedResponse('User account not found or inactive. Please login again.'));
      }

      res.status(500).json(errorResponse(
        'Token refresh failed. Please login again.',
        'AUTH_REFRESH_FAILED'
      ));
    }
  }

  /**
   * User logout endpoint
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      // In a more sophisticated implementation, we would:
      // 1. Add the token to a blacklist/revocation list
      // 2. Store blacklisted tokens in Redis or database
      // 3. Check blacklist in authentication middleware
      
      // For now, we'll just return success as the client should discard the token
      const userId = req.user?.userId;
      
      if (userId) {
        console.log(`User logout: ${userId} at ${new Date().toISOString()}`);
      }

      res.status(200).json(successResponse(
        'Logout successful',
        {
          message: 'You have been successfully logged out'
        }
      ));
    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json(errorResponse(
        'Logout failed',
        'AUTH_LOGOUT_FAILED'
      ));
    }
  }

  /**
   * Validate token endpoint (for client-side token validation)
   * GET /auth/validate
   */
  async validateToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware already validated it)
      const user = req.user;

      res.status(200).json(successResponse(
        'Token is valid',
        {
          user: {
            userId: user.userId,
            email: user.email,
            role: user.role
          },
          expires_at: new Date(user.exp * 1000).toISOString()
        }
      ));
    } catch (error) {
      console.error('Token validation error:', error);
      
      res.status(500).json(errorResponse(
        'Token validation failed',
        'AUTH_VALIDATION_FAILED'
      ));
    }
  }
}

module.exports = new AuthController();