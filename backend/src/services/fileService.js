const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    this.maxPhotosPerReport = 3;
    this.initialized = false;

    // Initialize directories synchronously to avoid async issues
    this.initializeDirectoriesSync();
  }

  initializeDirectoriesSync() {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
      if (!fs.existsSync(this.thumbnailDir)) {
        fs.mkdirSync(this.thumbnailDir, { recursive: true });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error creating upload directories:', error);
      this.initialized = false;
    }
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      console.error('Error creating upload directories:', error);
      this.initialized = false;
    }
  }

  // Configure multer for memory storage (we'll process before saving)
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: this.maxPhotosPerReport
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`), false);
        }
      }
    });
  }

  // Generate unique filename
  generateFilename(originalName, extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${timestamp}_${randomString}_${sanitizedName}${extension}`;
  }

  // Process and save uploaded photo
  async processAndSavePhoto(fileBuffer, originalName, mimetype) {
    try {
      // Generate filename
      const extension = this.getFileExtension(mimetype);
      const filename = this.generateFilename(originalName, extension);
      const filePath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

      // Process main image - compress and strip EXIF data
      const processedImage = await sharp(fileBuffer)
        .jpeg({ quality: 85, progressive: true })
        .withMetadata(false) // Strip EXIF data for privacy
        .toBuffer();

      // Create thumbnail
      const thumbnail = await sharp(fileBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .withMetadata(false)
        .toBuffer();

      // Save files
      await fs.writeFile(filePath, processedImage);
      await fs.writeFile(thumbnailPath, thumbnail);

      // Get file stats
      const stats = await fs.stat(filePath);

      return {
        id: crypto.randomUUID(),
        filename: filename,
        originalName: originalName,
        mimetype: 'image/jpeg', // Always JPEG after processing
        size: stats.size,
        url: `/uploads/photos/${filename}`,
        // thumbnailUrl: `/uploads/thumbnails/thumb_${filename}`,
        thumbnailUrl: `/uploads/photos/${filename}?thumbnail=true`,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error processing photo:', error);
      throw new Error('Failed to process photo');
    }
  }

  // Process multiple photos
  async processMultiplePhotos(files) {
    if (!files || files.length === 0) {
      throw new Error('No photos provided');
    }

    if (files.length > this.maxPhotosPerReport) {
      throw new Error(`Maximum ${this.maxPhotosPerReport} photos allowed per report`);
    }

    const processedPhotos = [];

    for (const file of files) {
      const photo = await this.processAndSavePhoto(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      processedPhotos.push(photo);
    }

    return processedPhotos;
  }

  // Get file extension from mimetype
  getFileExtension(mimetype) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    return extensions[mimetype] || '.jpg';
  }

  // Delete photo files
  async deletePhoto(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

      // Delete main file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Could not delete main file: ${filename}`, error.message);
      }

      // Delete thumbnail
      try {
        await fs.unlink(thumbnailPath);
      } catch (error) {
        console.warn(`Could not delete thumbnail: thumb_${filename}`, error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  // Validate photo upload request
  validatePhotoUpload(files) {
    if (!files || files.length === 0) {
      return { valid: false, error: 'At least 1 photo is required' };
    }

    if (files.length > this.maxPhotosPerReport) {
      return {
        valid: false,
        error: `Maximum ${this.maxPhotosPerReport} photos allowed per report`
      };
    }

    for (const file of files) {
      if (file.size > this.maxFileSize) {
        return {
          valid: false,
          error: `File ${file.originalname} exceeds maximum size of 5MB`
        };
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        return {
          valid: false,
          error: `File ${file.originalname} has invalid type. Allowed: JPEG, PNG, WebP`
        };
      }
    }

    return { valid: true };
  }

  // Get photo file path for serving
  getPhotoPath(filename, thumbnail = false) {
    if (thumbnail) {
      return path.join(this.thumbnailDir, `thumb_${filename}`);
    }
    return path.join(this.uploadDir, filename);
  }

  // Check if photo file exists
  async photoExists(filename) {
    try {
      const filePath = this.getPhotoPath(filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new FileService();