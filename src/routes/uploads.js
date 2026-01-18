const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const fileService = require('../services/fileService');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, fileSchemas } = require('../middleware/validation');

// Configure multer middleware
const upload = fileService.getMulterConfig();

// Upload photos (authenticated users only)
router.post('/photos', 
  authenticate,
  upload.array('photos', 3), // Accept up to 3 photos with field name 'photos'
  fileController.uploadPhotos
);

// Serve photo files (public access for now, can be restricted later)
router.get('/photos/:filename', 
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