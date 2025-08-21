// Export all repositories for easy importing
const userRepository = require('./userRepository');
const kidRepository = require('./kidRepository');
const contentRepository = require('./contentRepository');
const favoriteRepository = require('./favoriteRepository');

module.exports = {
  userRepository,
  kidRepository,
  contentRepository,
  favoriteRepository,
};
