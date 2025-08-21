const express = require('express');
const { authController } = require('../controllers');
const { authGuard, authRateLimit, writeSlowDown } = require('../middlewares');
const {
  validate,
  googleAuthSchema,
  refreshTokenSchema,
  logoutSchema,
  updateProfileSchema,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators');

const router = express.Router();

// Register new user
router.post('/register',
  authRateLimit,
  validate(registerSchema),
  authController.register
);

// Login user
router.post('/login',
  authRateLimit,
  validate(loginSchema),
  authController.login
);

// Verify email
router.post('/verify-email',
  authRateLimit,
  validate(verifyEmailSchema),
  authController.verifyEmail
);

// Forgot password
router.post('/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password
router.post('/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Google authentication
router.post('/google', 
  authRateLimit,
  validate(googleAuthSchema),
  authController.googleAuth
);

// Refresh access token
router.post('/refresh',
  authRateLimit,
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Logout
router.post('/logout',
  authRateLimit,
  validate(logoutSchema),
  authController.logout
);

// Get current user profile (protected)
router.get('/me',
  authGuard,
  authController.getProfile
);

// Update user profile (protected)
router.patch('/me',
  authGuard,
  writeSlowDown,
  validate(updateProfileSchema),
  authController.updateProfile
);

module.exports = router;
