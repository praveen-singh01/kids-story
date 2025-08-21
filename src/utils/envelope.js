/**
 * Standard response envelope for all API responses
 * Format: { success: boolean, data: object|null, error: string[], message: string }
 */

/**
 * Create success response envelope
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {object} Success envelope
 */
function success(data = null, message = '') {
  return {
    success: true,
    data,
    error: [],
    message,
  };
}

/**
 * Create error response envelope
 * @param {string|string[]} errors - Error codes or messages
 * @param {string} message - Human-readable error message
 * @param {*} data - Optional error data
 * @returns {object} Error envelope
 */
function error(errors = [], message = 'An error occurred', data = null) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  return {
    success: false,
    data,
    error: errorArray,
    message,
  };
}

/**
 * Create validation error envelope
 * @param {object} validationErrors - Zod validation errors
 * @returns {object} Validation error envelope
 */
function validationError(validationErrors) {
  const errors = validationErrors.issues?.map(issue => ({
    field: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  })) || ['VALIDATION_ERROR'];
  
  return error(errors, 'Validation failed');
}

module.exports = {
  success,
  error,
  validationError,
};
