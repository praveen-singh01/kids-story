const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const logger = require('../config/logger');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: ['Too many authentication attempts, please try again later.'],
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be 10 digits starting with 6-9')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateGoogleAuth = [
  body('idToken')
    .notEmpty()
    .withMessage('Google ID token is required')
];

const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).error(errorMessages, 'Validation failed');
  }
  next();
};

// POST /auth/register
router.post('/register', authLimiter, validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    const result = await authService.registerWithEmail({ email, password, name, phone });

    res.status(201).success({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      emailVerificationToken: result.emailVerificationToken
    }, 'User registered successfully');

  } catch (error) {
    logger.error('Registration error:', error);

    if (error.message === 'User already exists with this email') {
      return res.status(409).error([error.message], 'Registration failed');
    }

    res.status(500).error(['Registration failed'], 'Internal server error');
  }
});

// POST /auth/login
router.post('/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginWithEmail(email, password);
    
    res.success({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Login successful');
    
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).error([error.message], 'Login failed');
    }
    
    res.status(500).error(['Login failed'], 'Internal server error');
  }
});

// POST /auth/google
router.post('/google', authLimiter, validateGoogleAuth, handleValidationErrors, async (req, res) => {
  try {
    const { idToken } = req.body;
    
    const result = await authService.loginWithGoogle(idToken);
    
    res.success({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Authentication successful');
    
  } catch (error) {
    logger.error('Google auth error:', error);
    
    if (error.message === 'Google authentication failed') {
      return res.status(401).error([error.message], 'Authentication failed');
    }
    
    res.status(500).error(['Authentication failed'], 'Internal server error');
  }
});

// POST /auth/verify-email
router.post('/verify-email', validateEmailVerification, handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.body;
    
    const user = await authService.verifyEmail(token);
    
    res.success({ user }, 'Email verified successfully');
    
  } catch (error) {
    logger.error('Email verification error:', error);
    
    if (error.message === 'Invalid verification token') {
      return res.status(400).error([error.message], 'Verification failed');
    }
    
    res.status(500).error(['Verification failed'], 'Internal server error');
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).error(['Refresh token is required'], 'Token refresh failed');
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    res.success({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Token refreshed successfully');
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.message === 'Invalid refresh token') {
      return res.status(401).error([error.message], 'Token refresh failed');
    }
    
    res.status(500).error(['Token refresh failed'], 'Internal server error');
  }
});

module.exports = router;
