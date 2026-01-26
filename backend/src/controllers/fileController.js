const fileService = require('../services/fileService');
const { successResponse, errorResponse } = require('../utils/response');

class FileController {
  /**
   * Upload photos for a report
   * POST /uploads/photos
   */
  async uploadPhotos(req, res) {
    try {
      const files = req.files;

      // Validate files
      const validation = fileService.validatePhotoUpload(files);
      // Process and save photos
      const processedPhotos = await fileService.processMultiplePhotos(files);

      return res.status(201).json(successResponse(
        'Photos uploaded successfully',
        {
          photos: processedPhotos,
          count: processedPhotos.length
        }
      ));

    } catch (error) {
      console.error('Photo upload error:', error);

      if (error.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 'File size exceeds 5MB limit', 'FILE_TOO_LARGE', 400);
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return errorResponse(res, 'Maximum 3 photos allowed per upload', 'TOO_MANY_FILES', 400);
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return errorResponse(res, 'Unexpected file field', 'INVALID_FIELD', 400);
      }

      return errorResponse(res, error.message || 'Failed to upload photos', 'UPLOAD_ERROR', 500);
    }
  }

  /**
   * Serve photo file
   * GET /uploads/photos/:filename
   */
  async servePhoto(req, res) {
    try {
      const { filename } = req.params;
      const { thumbnail } = req.query;

      // Validate filename for security (path traversal protection)
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid filename',
          error_code: 'INVALID_FILENAME',
          timestamp: new Date().toISOString()
        });
      }

      // Additional validation for allowed characters
      if (!/^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Invalid filename format',
          error_code: 'INVALID_FILENAME',
          timestamp: new Date().toISOString()
        });
      }

      // Check if photo exists with timeout
      const existsPromise = fileService.photoExists(filename);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );

      let exists;
      try {
        exists = await Promise.race([existsPromise, timeoutPromise]);
      } catch (error) {
        if (error.message === 'Timeout') {
          return res.status(500).json({
            success: false,
            data: null,
            message: 'File system timeout',
            error_code: 'TIMEOUT_ERROR',
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }

      if (!exists) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Photo not found',
          error_code: 'PHOTO_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Get file path
      const filePath = fileService.getPhotoPath(filename, thumbnail === 'true');

      // Determine content type based on extension
      const ext = filename.split('.').pop().toLowerCase();
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Send file using absolute path
      const path = require('path');
      const absolutePath = path.resolve(filePath);

      res.sendFile(absolutePath, (err) => {
        if (err) {
          console.error('Error serving photo:', err);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              data: null,
              message: 'Failed to serve photo',
              error_code: 'SERVE_ERROR',
              timestamp: new Date().toISOString()
            });
          }
        }
      });

    } catch (error) {
      console.error('Photo serve error:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          data: null,
          message: 'Failed to serve photo',
          error_code: 'SERVE_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Delete photo (admin only)
   * DELETE /uploads/photos/:filename
   */
  async deletePhoto(req, res) {
    try {
      const { filename } = req.params;

      // Validate filename
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return errorResponse(res, 'Invalid filename', 'INVALID_FILENAME', 400);
      }

      // Check if photo exists
      const exists = await fileService.photoExists(filename);
      if (!exists) {
        return res.status(404).json(errorResponse('Photo not found', 'PHOTO_NOT_FOUND'));
      }

      // Delete photo
      const deleted = await fileService.deletePhoto(filename);
      if (!deleted) {
        return res.status(500).json(errorResponse('Failed to delete photo', 'DELETE_ERROR'));
      }

      return res.status(200).json(successResponse('Photo deleted successfully'));

    } catch (error) {
      console.error('Photo delete error:', error);
      return res.status(500).json(errorResponse('Failed to delete photo', 'DELETE_ERROR'));
    }
  }

  /**
   * Get upload configuration info
   * GET /uploads/config
   */
  getUploadConfig(req, res) {
    try {
      // Return static configuration without depending on file service
      const config = {
        maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
        maxPhotosPerReport: 3,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      };

      return res.status(200).json({
        success: true,
        data: config,
        message: 'Upload configuration retrieved',
        error_code: null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Config error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to get upload configuration',
        error_code: 'CONFIG_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new FileController();