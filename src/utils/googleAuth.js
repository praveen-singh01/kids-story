const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const logger = require('./logger');
const { GoogleAuthError } = require('./errors');

const client = new OAuth2Client(config.googleClientId);

/**
 * Verify Google ID token and extract user info
 * @param {string} idToken - Google ID token from client
 * @returns {Promise<{email: string, name?: string, emailVerified: boolean}>}
 */
async function verifyGoogleIdToken(idToken) {
  try {
    if (!idToken) {
      throw new GoogleAuthError('Google ID token is required');
    }

    if (typeof idToken !== 'string' || idToken.trim() === '') {
      throw new GoogleAuthError('Invalid Google ID token format');
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new GoogleAuthError('Invalid token payload');
    }

    if (!payload.email_verified) {
      throw new GoogleAuthError('Email not verified by Google');
    }

    return {
      email: payload.email,
      name: payload.name,
      emailVerified: payload.email_verified,
      googleId: payload.sub,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Google ID token verification failed');

    // If it's already a GoogleAuthError, re-throw it
    if (error instanceof GoogleAuthError) {
      throw error;
    }

    // Handle specific Google Auth Library errors
    if (error.message.includes('Wrong number of segments')) {
      throw new GoogleAuthError('Invalid Google ID token format');
    }

    if (error.message.includes('Invalid token signature')) {
      throw new GoogleAuthError('Invalid Google ID token signature');
    }

    if (error.message.includes('Token used too early') || error.message.includes('Token used too late')) {
      throw new GoogleAuthError('Google ID token expired or not yet valid');
    }

    // Generic Google auth error
    throw new GoogleAuthError('Google ID token verification failed');
  }
}

module.exports = {
  verifyGoogleIdToken,
};
