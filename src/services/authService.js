const { User } = require('../models');
const JWTUtils = require('../utils/jwt');
const googleAuth = require('../utils/googleAuth');
const logger = require('../config/logger');

class AuthService {
  async registerWithEmail(userData) {
    const { email, password, name, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Check if phone number is already taken (if provided)
    if (phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser) {
        throw new Error('User already exists with this phone number');
      }
    }

    // Generate email verification token
    const emailVerificationToken = JWTUtils.generateEmailVerificationToken();

    // Create user
    const user = new User({
      email,
      password,
      name,
      phone,
      provider: 'email',
      emailVerificationToken,
      roles: ['user']
    });

    await user.save();

    // Generate tokens
    const tokens = JWTUtils.generateTokens({ userId: user._id });

    logger.info(`New user registered: ${email}${phone ? ` with phone: ${phone}` : ''}`);

    return {
      user,
      ...tokens,
      emailVerificationToken
    };
  }

  async loginWithEmail(email, password) {
    // Find user with password field
    const user = await User.findOne({ email, provider: 'email' }).select('+password');
    
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const tokens = JWTUtils.generateTokens({ userId: user._id });

    logger.info(`User logged in: ${email}`);

    return {
      user,
      ...tokens
    };
  }

  async loginWithGoogle(idToken) {
    try {
      let googleUser;

      // TEMPORARY: Skip Google token verification for development
      if (process.env.SKIP_GOOGLE_VERIFICATION === 'true') {
        logger.info('Skipping Google token verification - extracting user info from token payload');

        // Decode the JWT token without verification to extract user info
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            googleUser = {
              googleId: payload.sub || 'temp_' + Date.now(),
              email: payload.email || 'user@example.com',
              name: payload.name || 'Google User',
              picture: payload.picture || null,
              emailVerified: payload.email_verified || true
            };
            logger.info(`Extracted user info from token: ${googleUser.email}`);
          } else {
            throw new Error('Invalid token format');
          }
        } catch (decodeError) {
          logger.warn('Failed to decode token, using fallback user data:', decodeError.message);
          // Fallback user data if token decode fails
          googleUser = {
            googleId: 'fallback_' + Date.now(),
            email: 'fallback.user@example.com',
            name: 'Fallback User',
            picture: null,
            emailVerified: true
          };
        }
      } else {
        // Production: Verify Google ID token
        googleUser = await googleAuth.verifyIdToken(idToken);
      }

      // Find or create user (same logic for both dev and production)
      let user = await User.findOne({
        $or: [
          { email: googleUser.email },
          { providerId: googleUser.googleId, provider: 'google' }
        ]
      });

      if (user) {
        // Update existing user
        if (user.provider !== 'google') {
          // User exists with email provider, update to Google
          user.provider = 'google';
          user.providerId = googleUser.googleId;
        }

        user.emailVerified = googleUser.emailVerified;
        user.name = googleUser.name; // Update name from Google
        await user.updateLastLogin();
      } else {
        // Create new user
        user = new User({
          email: googleUser.email,
          name: googleUser.name,
          provider: 'google',
          providerId: googleUser.googleId,
          emailVerified: googleUser.emailVerified,
          roles: ['user']
        });
        await user.save();

        logger.info(`New Google user registered: ${googleUser.email}`);
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokens({ userId: user._id });

      return {
        user,
        ...tokens
      };
    } catch (error) {
      logger.error('Google authentication error:', error);
      throw new Error('Google authentication failed');
    }
  }

  async verifyEmail(token) {
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    return user;
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = JWTUtils.generateTokens({ userId: user._id });

      return {
        user,
        ...tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async requestPasswordReset(email) {
    const user = await User.findOne({ email, provider: 'email' });
    
    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = JWTUtils.generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetToken = JWTUtils.hashToken(resetToken);
    user.passwordResetExpires = resetExpires;
    await user.save();

    logger.info(`Password reset requested for user: ${email}`);

    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken // In production, this would be sent via email
    };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = JWTUtils.hashToken(token);
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.info(`Password reset completed for user: ${user.email}`);

    return user;
  }
}

module.exports = new AuthService();
