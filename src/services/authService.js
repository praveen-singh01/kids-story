const { verifyGoogleIdToken } = require('../utils/googleAuth');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
// TODO: Redis temporarily disabled
// const { cache } = require('../loaders/redisLoader');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');
const { GoogleAuthError, AuthenticationError } = require('../utils/errors');

class AuthService {
  /**
   * Register new user with email and password
   */
  async register(userData) {
    try {
      const { email, password, name } = userData;

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new AuthenticationError('User already exists with this email');
      }

      // Create new user
      const user = await userRepository.create({
        email: email.toLowerCase(),
        name,
        password,
        provider: 'local',
        roles: ['user'],
        isEmailVerified: false, // Will need email verification
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id.toString());
      const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());

      // TODO: Redis temporarily disabled
      // Store refresh token JTI in cache
      // const refreshTtlSeconds = this.parseTimeToSeconds('30d');
      // await cache.set(`refresh:${jti}`, user._id.toString(), refreshTtlSeconds);

      logger.info({ userId: user._id, email: user.email }, 'User registered successfully');

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
        emailVerificationToken: verificationToken, // For testing/development
      };
    } catch (error) {
      logger.error({ error: error.message }, 'User registration failed');

      // If it's already an AuthenticationError, re-throw it
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // For other errors, wrap in AuthenticationError
      throw new AuthenticationError('Registration failed');
    }
  }

  /**
   * Login user with email and password
   */
  async login(email, password) {
    try {
      // Find user by email (with methods for authentication)
      const user = await userRepository.findByEmailForAuth(email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is local provider
      if (user.provider !== 'local') {
        throw new AuthenticationError('Please use Google sign-in for this account');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      await userRepository.updateLastLogin(user._id);

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id.toString());
      const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());

      // TODO: Redis temporarily disabled
      // Store refresh token JTI in cache
      // const refreshTtlSeconds = this.parseTimeToSeconds('30d');
      // await cache.set(`refresh:${jti}`, user._id.toString(), refreshTtlSeconds);

      logger.info({ userId: user._id, email: user.email }, 'User logged in successfully');

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'User login failed');

      // If it's already an AuthenticationError, re-throw it
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // For other errors, wrap in AuthenticationError
      throw new AuthenticationError('Login failed');
    }
  }

  /**
   * Verify email with verification token
   */
  async verifyEmail(token) {
    try {
      const user = await userRepository.findByEmailVerificationToken(token);
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      logger.info({ userId: user._id, email: user.email }, 'Email verified successfully');

      return {
        user: this.sanitizeUser(user),
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Email verification failed');
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return { message: 'If the email exists, a reset link has been sent' };
      }

      if (user.provider !== 'local') {
        throw new Error('Password reset not available for Google accounts');
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send email with reset token
      // For now, return token for testing
      logger.info({ userId: user._id, email: user.email }, 'Password reset requested');

      return {
        message: 'Password reset email sent',
        resetToken, // For testing/development only
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Password reset request failed');
      throw error;
    }
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await userRepository.findByPasswordResetToken(token);
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if token is expired
      if (user.passwordResetExpires < Date.now()) {
        throw new Error('Reset token has expired');
      }

      // Update password
      user.password = newPassword;
      user.clearPasswordResetToken();
      await user.save();

      logger.info({ userId: user._id, email: user.email }, 'Password reset successfully');

      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Password reset failed');
      throw error;
    }
  }

  /**
   * Authenticate user with Google ID token
   */
  async authenticateWithGoogle(idToken) {
    try {
      // Verify Google ID token
      const googleData = await verifyGoogleIdToken(idToken);

      // Find or create user
      const user = await userRepository.findOrCreate(googleData);

      // Generate JWT tokens
      const accessToken = generateAccessToken(user._id.toString());
      const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());

      // TODO: Redis temporarily disabled
      // Store refresh token JTI in cache for revocation tracking
      // const refreshTtlSeconds = this.parseTimeToSeconds('30d');
      // await cache.set(`refresh:${jti}`, user._id.toString(), refreshTtlSeconds);

      logger.info({ userId: user._id, email: user.email }, 'User authenticated with Google');

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Google authentication failed');

      // If it's already a GoogleAuthError, re-throw it to preserve the 401 status
      if (error instanceof GoogleAuthError) {
        throw error;
      }

      // For other errors, wrap in GoogleAuthError
      throw new GoogleAuthError('Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }
      
      const { sub: userId, jti } = decoded;
      
      // TODO: Redis temporarily disabled - skip token validation
      // Check if refresh token is blacklisted
      // const isBlacklisted = await cache.isBlacklisted(`refresh:${jti}`);
      // if (isBlacklisted) {
      //   throw new Error('Refresh token has been revoked');
      // }

      // Check if refresh token exists in cache
      // const cachedUserId = await cache.get(`refresh:${jti}`);
      // if (!cachedUserId || cachedUserId !== userId) {
      //   throw new Error('Refresh token not found or invalid');
      // }
      
      // Get user
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }
      
      // Generate new tokens (rotation)
      const newAccessToken = generateAccessToken(userId);
      const { token: newRefreshToken, jti: newJti } = generateRefreshToken(userId);
      
      // TODO: Redis temporarily disabled
      // Blacklist old refresh token
      // const refreshTtlSeconds = this.parseTimeToSeconds('30d');
      // await cache.blacklist(`refresh:${jti}`, refreshTtlSeconds);

      // Store new refresh token
      // await cache.set(`refresh:${newJti}`, userId, refreshTtlSeconds);
      
      logger.info({ userId }, 'Access token refreshed');
      
      return {
        user: this.sanitizeUser(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Token refresh failed');

      // If it's already an AuthenticationError, re-throw it
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // For other errors, wrap in AuthenticationError
      throw new AuthenticationError('Token refresh failed');
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const { jti } = decoded;
      
      // TODO: Redis temporarily disabled
      // Blacklist refresh token
      // const refreshTtlSeconds = this.parseTimeToSeconds('30d');
      // await cache.blacklist(`refresh:${jti}`, refreshTtlSeconds);

      // Remove from active tokens
      // await cache.del(`refresh:${jti}`);
      
      logger.info({ userId: decoded.sub }, 'User logged out');
      
      return true;
    } catch (error) {
      logger.error({ error: error.message }, 'Logout failed');
      // Don't throw error for logout - it should be idempotent
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const user = await userRepository.findWithSubscription(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    const allowedFields = ['name'];
    const filteredData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }
    
    const user = await userRepository.updateById(userId, filteredData);
    if (!user) {
      throw new Error('User not found');
    }
    
    // TODO: Redis temporarily disabled
    // Invalidate user cache
    // await cache.del(`user:${userId}`);
    
    return this.sanitizeUser(user);
  }

  /**
   * Sanitize user object for API response
   */
  sanitizeUser(user) {
    // Convert Mongoose document to plain object if needed
    const userObj = user.toObject ? user.toObject() : user;

    const sanitized = {
      id: userObj._id,
      email: userObj.email,
      name: userObj.name,
      provider: userObj.provider,
      roles: userObj.roles,
      subscription: userObj.subscription,
      isEmailVerified: userObj.isEmailVerified,
      lastLoginAt: userObj.lastLoginAt,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
    };

    return sanitized;
  }

  /**
   * Parse time string to seconds
   */
  parseTimeToSeconds(timeString) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid time format');
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * Revoke all refresh tokens for a user (force logout from all devices)
   */
  async revokeAllTokens(userId) {
    // This would require storing all active refresh tokens per user
    // TODO: Redis temporarily disabled
    // For now, we'll just invalidate the user cache
    // await cache.del(`user:${userId}`);
    
    logger.info({ userId }, 'All tokens revoked for user');
    return true;
  }
}

module.exports = new AuthService();
