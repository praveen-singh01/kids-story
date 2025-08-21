const { verifyM2MToken } = require('../../../utils/jwt');
const config = require('../../../config');
const { error } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');

/**
 * Middleware to verify M2M JWT tokens for service-to-service communication
 */
function m2mGuard(expectedIssuer, expectedAudience) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(error(['MISSING_M2M_TOKEN'], 'M2M authorization token required'));
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        return res.status(401).json(error(['MISSING_M2M_TOKEN'], 'M2M authorization token required'));
      }

      // Verify M2M JWT token
      let decoded;
      try {
        decoded = verifyM2MToken(token, expectedIssuer, expectedAudience);
      } catch (jwtError) {
        logger.warn({ 
          error: jwtError.message, 
          expectedIssuer, 
          expectedAudience,
          token: token.substring(0, 20) + '...' 
        }, 'Invalid M2M JWT token');
        return res.status(401).json(error(['INVALID_M2M_TOKEN'], 'Invalid M2M token'));
      }

      // Attach M2M token info to request
      req.m2mToken = decoded;
      req.isM2M = true;
      
      // Add M2M info to logger context
      req.log = logger.child({ 
        m2mIssuer: decoded.iss, 
        m2mAudience: decoded.aud 
      });
      
      next();
    } catch (err) {
      logger.error({ error: err.message }, 'M2M guard error');
      return res.status(500).json(error(['M2M_AUTH_ERROR'], 'M2M authentication error'));
    }
  };
}

/**
 * M2M guard for payments service calling core service
 */
const paymentsM2MGuard = m2mGuard(config.payments.paymentsIss, config.payments.coreAud);

module.exports = {
  m2mGuard,
  paymentsM2MGuard,
};
