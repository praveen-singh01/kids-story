const JWTUtils = require('../utils/jwt');
const { User } = require('../models');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).error(['Access token is required'], 'Authentication required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).error(['Access token is required'], 'Authentication required');
    }

    // Verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).error(['User not found or inactive'], 'Authentication failed');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message === 'Invalid access token' || error.name === 'JsonWebTokenError') {
      return res.status(401).error(['Invalid access token'], 'Authentication failed');
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).error(['Access token expired'], 'Token expired');
    }
    
    return res.status(500).error(['Authentication service error'], 'Internal server error');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).error(['Authentication required'], 'Access denied');
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).error(['Insufficient permissions'], 'Access denied');
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    // Try to verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id.toString();
    }
    
    next();
  } catch (error) {
    // Log the error but continue without authentication
    logger.warn('Optional authentication failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
