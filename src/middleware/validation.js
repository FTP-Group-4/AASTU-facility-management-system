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
      Joi.string().pattern(/^AASTU-FIX-\d{8}-\d{4}$/)
    ).required().messages({
      'string.pattern.base': 'Invalid report ID or ticket ID format'
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
  paramSchemas
};