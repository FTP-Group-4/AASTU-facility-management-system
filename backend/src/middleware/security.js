const rateLimit = require('express-rate-limit');

/**
 * Security middleware for input sanitization and additional protection
 */

/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters and scripts
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeValue(obj[key]);
          }
        }
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values (take the last one)
  const cleanParams = (params) => {
    for (const key in params) {
      if (Array.isArray(params[key])) {
        params[key] = params[key][params[key].length - 1];
      }
    }
  };

  if (req.query) {
    cleanParams(req.query);
  }

  if (req.body && typeof req.body === 'object') {
    cleanParams(req.body);
  }

  next();
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      error_code: 'REQUEST_TOO_LARGE',
      data: null,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * API key validation for sensitive operations (if needed)
 */
const validateApiKey = (req, res, next) => {
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    // If no API key is configured, skip validation
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key',
      error_code: 'INVALID_API_KEY',
      data: null,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * IP whitelist middleware for admin operations
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    // Skip in development/test
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return next();
    }

    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        error_code: 'IP_NOT_ALLOWED',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Request logging for security monitoring
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log security-relevant information
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous',
    role: req.user?.role || 'none'
  };

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /exec\(/i,  // Code injection
    /eval\(/i   // Code injection
  ];

  const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (isSuspicious) {
    console.warn('🚨 SUSPICIOUS REQUEST DETECTED:', logData);
  }

  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400) {
      console.warn('⚠️  ERROR RESPONSE:', {
        ...logData,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

module.exports = {
  sanitizeInput,
  preventParameterPollution,
  requestSizeLimit,
  securityHeaders,
  validateApiKey,
  ipWhitelist,
  securityLogger
};