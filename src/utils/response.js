/**
 * Standardized API response utilities
 */

/**
 * Success response format
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Formatted success response
 */
const successResponse = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error response format
 * @param {string} message - Error message
 * @param {string} errorCode - System error code
 * @param {any} data - Additional error data
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {object} Formatted error response
 */
const errorResponse = (message, errorCode = 'GENERAL_ERROR', data = null, statusCode = 400) => {
  return {
    success: false,
    message,
    error_code: errorCode,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validation error response
 * @param {array} errors - Array of validation errors
 * @returns {object} Formatted validation error response
 */
const validationErrorResponse = (errors) => {
  return errorResponse(
    'Validation failed',
    'VALID_INVALID_INPUT',
    { errors },
    400
  );
};

/**
 * Not found error response
 * @param {string} resource - Resource that was not found
 * @returns {object} Formatted not found response
 */
const notFoundResponse = (resource = 'Resource') => {
  return errorResponse(
    `${resource} not found`,
    'RESOURCE_NOT_FOUND',
    null,
    404
  );
};

/**
 * Unauthorized error response
 * @param {string} message - Custom message (optional)
 * @returns {object} Formatted unauthorized response
 */
const unauthorizedResponse = (message = 'Unauthorized access') => {
  return errorResponse(
    message,
    'AUTH_INSUFFICIENT_PERMISSIONS',
    null,
    401
  );
};

/**
 * Forbidden error response
 * @param {string} message - Custom message (optional)
 * @returns {object} Formatted forbidden response
 */
const forbiddenResponse = (message = 'Access forbidden') => {
  return errorResponse(
    message,
    'AUTH_INSUFFICIENT_PERMISSIONS',
    null,
    403
  );
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse
};