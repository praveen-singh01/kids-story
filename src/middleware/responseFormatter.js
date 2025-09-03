/**
 * Response formatter middleware
 * Adds success() and error() methods to the response object
 * to ensure consistent API response format
 */

const responseFormatter = (req, res, next) => {
  // Success response method
  res.success = (data = null, message = 'Success') => {
    const response = {
      success: true,
      data,
      message
    };
    
    return res.json(response);
  };

  // Error response method
  res.error = (errors = [], message = 'Error') => {
    const response = {
      success: false,
      error: Array.isArray(errors) ? errors : [errors],
      message
    };
    
    return res.json(response);
  };

  next();
};

module.exports = responseFormatter;
