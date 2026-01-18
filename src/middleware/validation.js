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
  })
};

module.exports = {
  validate,
  authSchemas,
  userSchemas,
  blockSchemas,
  fileSchemas,
  paramSchemas
};