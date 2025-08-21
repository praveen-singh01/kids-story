const { authService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class AuthController {
  /**
   * Register new user with email and password
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      const result = await authService.register({ email, password, name });

      res.status(201).json(success(result, 'User registered successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login user with email and password
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json(success(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify email with verification token
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      const result = await authService.verifyEmail(token);

      res.json(success(result, 'Email verified successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      res.json(success(result, 'Password reset email sent'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const result = await authService.resetPassword(token, password);

      res.json(success(result, 'Password reset successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticate with Google ID token
   */
  async googleAuth(req, res, next) {
    try {
      const { idToken } = req.body;
      
      const result = await authService.authenticateWithGoogle(idToken);
      
      res.json(success(result, 'Authentication successful'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      res.json(success(result, 'Token refreshed successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      await authService.logout(refreshToken);
      
      res.json(success(null, 'Logged out successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.userId;
      
      const user = await authService.getUserProfile(userId);
      
      res.json(success(user, 'Profile retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.userId;
      const updateData = req.body;
      
      const user = await authService.updateUserProfile(userId, updateData);
      
      res.json(success(user, 'Profile updated successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
