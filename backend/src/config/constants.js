// User roles
const USER_ROLES = {
  REPORTER: 'reporter',
  COORDINATOR: 'coordinator',
  ELECTRICAL_FIXER: 'electrical_fixer',
  MECHANICAL_FIXER: 'mechanical_fixer',
  ADMIN: 'admin'
};

// Report statuses
const REPORT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  REOPENED: 'reopened'
};

// Report categories
const REPORT_CATEGORIES = {
  ELECTRICAL: 'electrical',
  MECHANICAL: 'mechanical'
};

// Priority levels
const PRIORITY_LEVELS = {
  EMERGENCY: 'emergency',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Location types
const LOCATION_TYPES = {
  SPECIFIC: 'specific',
  GENERAL: 'general'
};

// Notification types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ALERT: 'alert'
};

// File upload constraints
const FILE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_PHOTOS_PER_REPORT: 3,
  MIN_PHOTOS_PER_REPORT: 1
};

// Block constraints
const BLOCK_CONSTRAINTS = {
  MIN_BLOCK_NUMBER: 1,
  MAX_BLOCK_NUMBER: 100
};

// Validation constraints
const VALIDATION_CONSTRAINTS = {
  PROBLEM_DESCRIPTION_MIN: 10,
  PROBLEM_DESCRIPTION_MAX: 500,
  COMMENT_MIN: 20,
  RATING_MIN: 0,
  RATING_MAX: 5
};

// Error codes
const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Validation errors
  VALID_INVALID_INPUT: 'VALID_001',
  VALID_MISSING_REQUIRED_FIELD: 'VALID_002',
  VALID_INVALID_FORMAT: 'VALID_003',
  
  // Report errors
  REPORT_DUPLICATE_DETECTED: 'REPORT_001',
  REPORT_INVALID_STATE_TRANSITION: 'REPORT_002',
  REPORT_NOT_FOUND: 'REPORT_003',
  
  // System errors
  SYSTEM_DATABASE_ERROR: 'SYSTEM_001',
  SYSTEM_SERVICE_UNAVAILABLE: 'SYSTEM_002',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_001'
};

module.exports = {
  USER_ROLES,
  REPORT_STATUS,
  REPORT_CATEGORIES,
  PRIORITY_LEVELS,
  LOCATION_TYPES,
  NOTIFICATION_TYPES,
  FILE_CONSTRAINTS,
  BLOCK_CONSTRAINTS,
  VALIDATION_CONSTRAINTS,
  ERROR_CODES
};