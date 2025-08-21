const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const logger = require('./logger');

const client = new OAuth2Client(config.googleClientId);

/**
 * Verify Google ID token and extract user info
 * @param {string} idToken - Google ID token from client
 * @returns {Promise<{email: string, name?: string, emailVerified: boolean}>}
 */
async function verifyGoogleIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    if (!payload.email_verified) {
      throw new Error('Email not verified by Google');
    }
    
    return {
      email: payload.email,
      name: payload.name,
      emailVerified: payload.email_verified,
      googleId: payload.sub,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Google ID token verification failed');
    throw new Error('Invalid Google ID token');
  }
}

module.exports = {
  verifyGoogleIdToken,
};
