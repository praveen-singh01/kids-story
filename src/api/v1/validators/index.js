// Export all validators for easy importing
const validate = require('./validate');
const authValidators = require('./authValidators');
const kidValidators = require('./kidValidators');
const contentValidators = require('./contentValidators');
const favoriteValidators = require('./favoriteValidators');
const subscriptionValidators = require('./subscriptionValidators');
const adminValidators = require('./adminValidators');

module.exports = {
  validate,
  ...authValidators,
  ...kidValidators,
  ...contentValidators,
  ...favoriteValidators,
  ...subscriptionValidators,
  ...adminValidators,
};
