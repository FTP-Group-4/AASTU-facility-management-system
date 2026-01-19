const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { errorResponse } = require('../utils/response');

class AuthService {
  constructor() {
    this.saltRounds = 12;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.accessTokenExpiry = process.env.JWT_EXPIRY || '30m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match result
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }

  /**
   * Generate JWT access token
   * @param {object} payload - Token payload
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'aastu-facilities-api',
      audience: 'aastu-facilities-client'
    });
  }

  /**
   * Generate JWT refresh token
   * @param {object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'aastu-facilities-api',
      audience: 'aastu-facilities-client'
    });
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'aastu-facilities-api',
        audience: 'aastu-facilities-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify JWT refresh token
   * @param {string} token - JWT refresh token
   * @returns {object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'aastu-facilities-api',
        audience: 'aastu-facilities-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Validate AASTU email format
   * @param {string} email - Email address
   * @returns {boolean} Email validation result
   */
  validateAASTUEmail(email) {
    const aastuEmailRegex = /^[a-zA-Z0-9._%+-]+@(aastu\.edu\.et|aastustudent\.edu\.et)$/;
    return aastuEmailRegex.test(email);
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Authentication result
   */
  async authenticateUser(email, password) {
    try {
      // Validate AASTU email format
      if (!this.validateAASTUEmail(email)) {
        throw new Error('Invalid AASTU email format');
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password_hash: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ userId: user.id });

      // Return user data without password hash
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: this.parseExpiryToSeconds(this.accessTokenExpiry)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<object>} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true
        }
      });

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        expiresIn: this.parseExpiryToSeconds(this.accessTokenExpiry)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse expiry string to seconds
   * @param {string} expiry - Expiry string (e.g., '30m', '1h', '7d')
   * @returns {number} Expiry in seconds
   */
  parseExpiryToSeconds(expiry) {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 1800; // 30 minutes default
    }
  }

  /**
   * Create new user (for admin use)
   * @param {object} userData - User data
   * @returns {Promise<object>} Created user
   */
  async createUser(userData) {
    try {
      const { email, password, full_name, phone, department, role } = userData;

      // Validate AASTU email format
      if (!this.validateAASTUEmail(email)) {
        throw new Error('Invalid AASTU email format');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          full_name,
          phone,
          department,
          role
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          department: true,
          role: true,
          is_active: true,
          created_at: true
        }
      });

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();