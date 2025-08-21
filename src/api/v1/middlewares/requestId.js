const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add unique request ID to each request
 */
function requestIdMiddleware(req, res, next) {
  // Check if request ID already exists in headers
  const existingRequestId = req.headers['x-request-id'] || req.headers['request-id'];
  
  // Generate new request ID if not provided
  const requestId = existingRequestId || uuidv4();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Add request ID to logger context if logger exists
  if (req.log) {
    req.log = req.log.child({ requestId });
  }
  
  next();
}

module.exports = requestIdMiddleware;
