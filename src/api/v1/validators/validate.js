const { validationError } = require('../../../utils/envelope');

/**
 * Middleware factory for Zod validation
 * @param {object} schema - Zod schema object with optional body, params, query properties
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Validate each part of the request
      const validationData = {};
      
      if (schema.body) {
        validationData.body = schema.body.parse(req.body);
      }
      
      if (schema.params) {
        validationData.params = schema.params.parse(req.params);
      }
      
      if (schema.query) {
        validationData.query = schema.query.parse(req.query);
      }
      
      // Replace request data with validated data
      if (validationData.body) req.body = validationData.body;
      if (validationData.params) req.params = validationData.params;
      if (validationData.query) req.query = validationData.query;
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json(validationError(error));
      }
      
      // Other validation errors
      return res.status(400).json(validationError(['VALIDATION_ERROR'], error.message));
    }
  };
}

module.exports = validate;
