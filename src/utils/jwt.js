const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Generate access token (15m TTL)
 */
function generateAccessToken(userId) {
  return jwt.sign(
    { 
      sub: userId,
      type: 'access',
    },
    config.jwt.accessSecret,
    { 
      expiresIn: config.jwt.accessTtl,
      issuer: 'bedtime-api',
      audience: 'bedtime-app',
    }
  );
}

/**
 * Generate refresh token (30d TTL) with unique jti for revocation
 */
function generateRefreshToken(userId) {
  const jti = uuidv4();
  const token = jwt.sign(
    { 
      sub: userId,
      type: 'refresh',
      jti,
    },
    config.jwt.refreshSecret,
    { 
      expiresIn: config.jwt.refreshTtl,
      issuer: 'bedtime-api',
      audience: 'bedtime-app',
    }
  );
  
  return { token, jti };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'bedtime-api',
    audience: 'bedtime-app',
  });
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'bedtime-api',
    audience: 'bedtime-app',
  });
}

/**
 * Generate M2M JWT for service-to-service communication
 */
function generateM2MToken(issuer, audience) {
  return jwt.sign(
    {
      iss: issuer,
      aud: audience,
      iat: Math.floor(Date.now() / 1000),
    },
    config.payments.m2mSecret,
    { 
      expiresIn: '60s', // Short TTL for M2M
      algorithm: 'HS256',
    }
  );
}

/**
 * Verify M2M JWT
 */
function verifyM2MToken(token, expectedIssuer, expectedAudience) {
  const decoded = jwt.verify(token, config.payments.m2mSecret, {
    algorithms: ['HS256'],
  });
  
  if (decoded.iss !== expectedIssuer || decoded.aud !== expectedAudience) {
    throw new Error('Invalid M2M token issuer or audience');
  }
  
  return decoded;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateM2MToken,
  verifyM2MToken,
};
