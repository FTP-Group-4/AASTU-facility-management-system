const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const fileService = require('../services/fileService');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, fileSchemas } = require('../middleware/validation');

// Configure multer middleware
const upload = fileService.getMulterConfig();

const rateLimit = require('express-rate-limit');

// Strict rate limiting for photo uploads
const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    error_code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Upload photos (authenticated users only)
router.post('/photos',
  authenticate,
  uploadLimiter,
  upload.array('photos', 3), // Accept up to 3 photos with field name 'photos'
  fileController.uploadPhotos
);

// Serve photo files (public access for now, can be restricted later)
router.get('/photos/:filename',
  validate(fileSchemas.photoFilename, 'params'),
  validate(fileSchemas.photoQuery, 'query'),
  fileController.servePhoto
);

// Delete photo (admin only)
router.delete('/photos/:filename',
  authenticate,
  authorize(['admin']),
  validate(fileSchemas.photoFilename, 'params'),
  fileController.deletePhoto
);

// Get upload configuration (public)
router.get('/config', fileController.getUploadConfig);

module.exports = router;