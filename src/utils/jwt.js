const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
  static generateTokens(payload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'kids-story-api',
        audience: 'kids-story-app'
      }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'kids-story-api',
        audience: 'kids-story-app'
      }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'kids-story-api',
        audience: 'kids-story-app'
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        issuer: 'kids-story-api',
        audience: 'kids-story-app'
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = JWTUtils;
