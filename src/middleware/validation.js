const Joi = require('joi');
const { validationErrorResponse } = require('../utils/response');

/**
 * Validation middleware factory
 * @param {object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json(validationErrorResponse(errors));
    }

    req[property] = value;
    next();
  };
};

// Authentication validation schemas
const authSchemas = {
  login: Joi.object({
    email: Joi.string()
      .email()
      .pattern(/^[a-zA-Z0-9._%+-]+@(aastu\.edu\.et|aastustudent\.edu\.et)$/)
      .required()
      .messages({
        'string.pattern.base': 'Email must be a valid AASTU email address (@aastu.edu.et or @aastustudent.edu.et)'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long'
      }),
    device_id: Joi.string().optional()
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().required()
  }),

  createUser: Joi.object({
    email: Joi.string()
      .email()
      .pattern(/^[a-zA-Z0-9._%+-]+@(aastu\.edu\.et|aastustudent\.edu\.et)$/)
      .required()
      .messages({
        'string.pattern.base': 'Email must be a valid AASTU email address (@aastu.edu.et or @aastustudent.edu.et)'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    full_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+251[0-9]{9}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be in format +251XXXXXXXXX'
      }),
    department: Joi.string()
      .max(100)
      .optional(),
    role: Joi.string()
      .valid('reporter', 'coordinator', 'electrical_fixer', 'mechanical_fixer', 'admin')
      .required()
  })
};

// User profile validation schemas
const userSchemas = {
  updateProfile: Joi.object({
    full_name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+251[0-9]{9}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be in format +251XXXXXXXXX'
      }),
    avatar: Joi.string().optional() // Base64 encoded image
  }).min(1), // At least one field must be provided

  updateUser: Joi.object({
    role: Joi.string()
      .valid('reporter', 'coordinator', 'electrical_fixer', 'mechanical_fixer', 'admin')
      .optional(),
    is_active: Joi.boolean().optional()
  }).min(1), // At least one field must be provided

  getUsersQuery: Joi.object({
    role: Joi.string()
      .valid('reporter', 'coordinator', 'electrical_fixer', 'mechanical_fixer', 'admin')
      .optional(),
    is_active: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
  })
};

// Block validation schemas
const blockSchemas = {
  createBlock: Joi.object({
    block_number: Joi.number()
      .integer()
      .min(1)
      .max(200) // Allow higher numbers for testing
      .required()
      .messages({
        'number.min': 'Block number must be at least 1',
        'number.max': 'Block number must not exceed 200'
      }),
    name: Joi.string()
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional()
  }),

  updateBlock: Joi.object({
    name: Joi.string()
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional()
  }).min(1), // At least one field must be provided

  assignCoordinator: Joi.object({
    coordinator_id: Joi.string().required()
  }),

  getBlocksQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string().max(100).optional()
  })
};

// File upload validation schemas
const fileSchemas = {
  photoFilename: Joi.object({
    filename: Joi.string()
      .pattern(/^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i)
      .required()
      .messages({
        'string.pattern.base': 'Invalid filename format'
      })
  }),

  photoQuery: Joi.object({
    thumbnail: Joi.string().valid('true', 'false').optional()
  })
};

// Report validation schemas
const reportSchemas = {
  createReport: Joi.object({
    category: Joi.string()
      .valid('electrical', 'mechanical')
      .required()
      .messages({
        'any.only': 'Category must be either "electrical" or "mechanical"'
      }),
    location: Joi.object({
      type: Joi.string()
        .valid('specific', 'general')
        .required()
        .messages({
          'any.only': 'Location type must be either "specific" or "general"'
        }),
      block_id: Joi.when('type', {
        is: 'specific',
        then: Joi.number()
          .integer()
          .min(1)
          .max(100)
          .required()
          .messages({
            'number.min': 'Block number must be at least 1',
            'number.max': 'Block number must not exceed 100',
            'any.required': 'Block ID is required for specific locations'
          }),
        otherwise: Joi.forbidden()
      }),
      room_number: Joi.when('type', {
        is: 'specific',
        then: Joi.string()
          .max(20)
          .optional()
          .messages({
            'string.max': 'Room number must not exceed 20 characters'
          }),
        otherwise: Joi.forbidden()
      }),
      description: Joi.when('type', {
        is: 'general',
        then: Joi.string()
          .min(5)
          .max(200)
          .required()
          .messages({
            'string.min': 'Location description must be at least 5 characters',
            'string.max': 'Location description must not exceed 200 characters',
            'any.required': 'Location description is required for general locations'
          }),
        otherwise: Joi.forbidden()
      })
    }).required(),
    equipment_description: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Equipment description must be at least 5 characters',
        'string.max': 'Equipment description must not exceed 200 characters'
      }),
    problem_description: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Problem description must be at least 10 characters',
        'string.max': 'Problem description must not exceed 500 characters'
      }),
    force_submit: Joi.boolean().optional().default(false),
    ignore_duplicates: Joi.boolean().optional().default(false)
  }),

  updateReportStatus: Joi.object({
    status: Joi.string()
      .valid('submitted', 'under_review', 'approved', 'rejected', 'assigned', 'in_progress', 'completed', 'closed', 'reopened')
      .required()
      .messages({
        'any.only': 'Invalid status value'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Notes must not exceed 500 characters'
      }),
    priority: Joi.string()
      .valid('emergency', 'high', 'medium', 'low')
      .optional()
      .messages({
        'any.only': 'Priority must be one of: emergency, high, medium, low'
      }),
    assigned_to: Joi.string().optional(),
    rejection_reason: Joi.string()
      .max(300)
      .optional()
      .messages({
        'string.max': 'Rejection reason must not exceed 300 characters'
      })
  }),

  checkDuplicates: Joi.object({
    category: Joi.string()
      .valid('electrical', 'mechanical')
      .required(),
    location: Joi.object({
      type: Joi.string()
        .valid('specific', 'general')
        .required(),
      block_id: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional(),
      room_number: Joi.string()
        .max(20)
        .optional()
    }).required(),
    equipment_description: Joi.string()
      .min(5)
      .max(200)
      .required()
  }),

  getReportsQuery: Joi.object({
    status: Joi.string()
      .valid('submitted', 'under_review', 'approved', 'rejected', 'assigned', 'in_progress', 'completed', 'closed', 'reopened')
      .optional(),
    category: Joi.string()
      .valid('electrical', 'mechanical')
      .optional(),
    priority: Joi.string()
      .valid('emergency', 'high', 'medium', 'low')
      .optional(),
    block_id: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional(),
    submitted_by: Joi.string().optional(),
    assigned_to: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'status', 'priority', 'ticket_id')
      .default('created_at'),
    sort_order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
  }),

  rateReport: Joi.object({
    rating: Joi.number()
      .integer()
      .min(0)
      .max(5)
      .required()
      .messages({
        'number.min': 'Rating must be between 0 and 5',
        'number.max': 'Rating must be between 0 and 5'
      }),
    comment: Joi.when('rating', {
      is: Joi.number().max(3),
      then: Joi.string()
        .min(20)
        .max(500)
        .required()
        .messages({
          'string.min': 'Comment is required and must be at least 20 characters for ratings 0-3',
          'string.max': 'Comment must not exceed 500 characters',
          'any.required': 'Comment is required for ratings 0-3'
        }),
      otherwise: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Comment must not exceed 500 characters'
        })
    }),
    mark_still_broken: Joi.boolean()
      .optional()
      .default(false)
  })
};

// Parameter validation schemas
const paramSchemas = {
  userId: Joi.object({
    id: Joi.string().required()
  }),
  
  blockId: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string().valid('general')
    ).required()
  }),

  blockNumber: Joi.object({
    number: Joi.number().integer().min(1).max(100).required()
  }),

  coordinatorId: Joi.object({
    coordinatorId: Joi.string().required()
  }),

  blockIdAndCoordinatorId: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string().valid('general')
    ).required(),
    coordinatorId: Joi.string().required()
  }),

  reportId: Joi.object({
    id: Joi.alternatives().try(
      Joi.string().guid(),
      Joi.string().pattern(/^c[a-z0-9]{24}$/), // cuid format
      Joi.string().pattern(/^AASTU-FIX-\d{8}-\d{4}$/), // ticket ID format
      Joi.string().min(1) // Allow any non-empty string as fallback
    ).required().messages({
      'string.pattern.base': 'Invalid report ID or ticket ID format'
    })
  })
};

// Admin configuration validation schemas
const adminSchemas = {
  updateSystemConfig: Joi.object({
    sla_settings: Joi.object({
      emergency_hours: Joi.number().integer().min(1).max(24).optional(),
      high_hours: Joi.number().integer().min(1).max(72).optional(),
      medium_hours: Joi.number().integer().min(1).max(168).optional(),
      low_hours: Joi.number().integer().min(1).max(720).optional()
    }).optional(),
    notification_preferences: Joi.object({
      email_enabled: Joi.boolean().optional(),
      sms_enabled: Joi.boolean().optional(),
      push_enabled: Joi.boolean().optional(),
      emergency_immediate: Joi.boolean().optional()
    }).optional(),
    system_settings: Joi.object({
      max_photos_per_report: Joi.number().integer().min(1).max(10).optional(),
      max_file_size_mb: Joi.number().integer().min(1).max(50).optional(),
      duplicate_threshold: Joi.number().min(0.1).max(1.0).optional(),
      auto_assignment: Joi.boolean().optional()
    }).optional(),
    maintenance_mode: Joi.boolean().optional()
  }).min(1),

  createBlockAdmin: Joi.object({
    block_number: Joi.number()
      .integer()
      .min(1)
      .max(200)
      .required()
      .messages({
        'number.min': 'Block number must be at least 1',
        'number.max': 'Block number must not exceed 200'
      }),
    name: Joi.string()
      .max(100)
      .optional(),
    description: Joi.string()
      .max(500)
      .optional(),
    coordinator_ids: Joi.array()
      .items(Joi.string())
      .optional()
      .messages({
        'array.base': 'Coordinator IDs must be an array of strings'
      })
  }),

  bulkInitializeBlocks: Joi.object({
    start_number: Joi.number()
      .integer()
      .min(1)
      .max(200)
      .default(1),
    end_number: Joi.number()
      .integer()
      .min(1)
      .max(200)
      .default(100),
    prefix: Joi.string()
      .max(50)
      .default('Block')
  }).custom((value, helpers) => {
    if (value.start_number > value.end_number) {
      return helpers.error('custom.invalidRange');
    }
    return value;
  }).messages({
    'custom.invalidRange': 'Start number must be less than or equal to end number'
  })
};

// Body validation schemas
const bodySchemas = {
  reviewReport: Joi.object({
    action: Joi.string()
      .valid('approve', 'reject', 'review')
      .required()
      .messages({
        'any.only': 'Action must be one of: approve, reject, review'
      }),
    priority: Joi.when('action', {
      is: 'approve',
      then: Joi.string()
        .valid('emergency', 'high', 'medium', 'low')
        .required()
        .messages({
          'any.only': 'Priority must be one of: emergency, high, medium, low',
          'any.required': 'Priority is required when approving a report'
        }),
      otherwise: Joi.forbidden()
    }),
    rejection_reason: Joi.when('action', {
      is: 'reject',
      then: Joi.string()
        .min(10)
        .max(300)
        .required()
        .messages({
          'string.min': 'Rejection reason must be at least 10 characters',
          'string.max': 'Rejection reason must not exceed 300 characters',
          'any.required': 'Rejection reason is required when rejecting a report'
        }),
      otherwise: Joi.forbidden()
    }),
    assigned_to: Joi.string().optional(),
    notes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Notes must not exceed 500 characters'
      })
  }),

  updateJobStatus: Joi.object({
    status: Joi.string()
      .valid('assigned', 'in_progress', 'completed')
      .required()
      .messages({
        'any.only': 'Status must be one of: assigned, in_progress, completed'
      }),
    notes: Joi.when('status', {
      is: 'completed',
      then: Joi.string()
        .min(10)
        .max(500)
        .required()
        .messages({
          'string.min': 'Completion notes must be at least 10 characters',
          'string.max': 'Completion notes must not exceed 500 characters',
          'any.required': 'Completion notes are required when completing a job'
        }),
      otherwise: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Notes must not exceed 500 characters'
        })
    }),
    parts_used: Joi.string()
      .max(300)
      .optional()
      .messages({
        'string.max': 'Parts used description must not exceed 300 characters'
      }),
    time_spent_minutes: Joi.number()
      .integer()
      .min(1)
      .max(1440) // Max 24 hours
      .optional()
      .messages({
        'number.min': 'Time spent must be at least 1 minute',
        'number.max': 'Time spent must not exceed 1440 minutes (24 hours)'
      })
  })
};

module.exports = {
  validate,
  authSchemas,
  userSchemas,
  blockSchemas,
  fileSchemas,
  reportSchemas,
  paramSchemas,
  bodySchemas,
  adminSchemas
};