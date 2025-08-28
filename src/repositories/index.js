// Export all repositories for easy importing
const userRepository = require('./userRepository');
const kidRepository = require('./kidRepository');
const contentRepository = require('./contentRepository');
const categoryRepository = require('./categoryRepository');
const favoriteRepository = require('./favoriteRepository');

module.exports = {
  userRepository,
  kidRepository,
  contentRepository,
  categoryRepository,
  favoriteRepository,
};
