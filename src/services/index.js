// Export all services for easy importing
const authService = require('./authService');
const kidService = require('./kidService');
const contentService = require('./contentService');
const favoriteService = require('./favoriteService');
const subscriptionService = require('./subscriptionService');
const adminService = require('./adminService');

module.exports = {
  authService,
  kidService,
  contentService,
  favoriteService,
  subscriptionService,
  adminService,
};
