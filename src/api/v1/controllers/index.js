// Export all controllers for easy importing
const authController = require('./authController');
const kidController = require('./kidController');
const contentController = require('./contentController');
const favoriteController = require('./favoriteController');
const subscriptionController = require('./subscriptionController');
const adminController = require('./adminController');
const healthController = require('./healthController');

module.exports = {
  authController,
  kidController,
  contentController,
  favoriteController,
  subscriptionController,
  adminController,
  healthController,
};
