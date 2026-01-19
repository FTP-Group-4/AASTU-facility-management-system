const authService = require('../services/authService');
const { errorResponse, unauthorizedResponse, forbiddenResponse } = require('../utils/response');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(unauthorizedResponse('Access token required'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = authService.verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.message === 'Token expired') {
        return res.status(401).json(unauthorizedResponse('Token expired'));
      } else if (error.message === 'Invalid token') {
        return res.status(401).json(unauthorizedResponse('Invalid token'));
      } else {
        return res.status(401).json(unauthorizedResponse('Token verification failed'));
      }
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json(errorResponse('Authentication failed', 'AUTH_ERROR'));
  }
};

/**
 * Authorization middleware to check user roles
 * @param {string|array} allowedRoles - Single role or array of allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(unauthorizedResponse('Authentication required'));
      }

      const userRole = req.user.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
        return res.status(403).json(forbiddenResponse('Insufficient permissions'));
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json(errorResponse('Authorization failed', 'AUTH_ERROR'));
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = authService.verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Role-based access control helper
 */
const hasRole = (userRole, allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
};

/**
 * Check if user can access resource based on ownership or role
 * @param {string} resourceUserId - User ID of resource owner
 * @param {object} currentUser - Current authenticated user
 * @param {array} adminRoles - Roles that have admin access
 */
const canAccessResource = (resourceUserId, currentUser, adminRoles = ['admin']) => {
  // User can access their own resources
  if (currentUser.userId === resourceUserId) {
    return true;
  }

  // Admin roles can access any resource
  return hasRole(currentUser.role, adminRoles);
};

/**
 * Middleware to check resource ownership or admin access
 * @param {function} getResourceUserId - Function to extract resource user ID from request
 * @param {array} adminRoles - Roles that have admin access
 */
const checkResourceAccess = (getResourceUserId, adminRoles = ['admin']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(unauthorizedResponse('Authentication required'));
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (!canAccessResource(resourceUserId, req.user, adminRoles)) {
        return res.status(403).json(forbiddenResponse('Cannot access this resource'));
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json(errorResponse('Access check failed', 'AUTH_ERROR'));
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  hasRole,
  canAccessResource,
  checkResourceAccess
};