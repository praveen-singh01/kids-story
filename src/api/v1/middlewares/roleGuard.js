const { error } = require('../../../utils/envelope');

/**
 * Middleware to check if user has required role
 * Must be used after authGuard
 */
function roleGuard(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error(['UNAUTHORIZED'], 'Authentication required'));
    }

    if (!req.user.roles || !req.user.roles.includes(requiredRole)) {
      return res.status(403).json(error(['INSUFFICIENT_PERMISSIONS'], `${requiredRole} role required`));
    }

    next();
  };
}

/**
 * Middleware to check if user has admin role
 */
const adminGuard = roleGuard('admin');

/**
 * Middleware to check if user has any of the specified roles
 */
function anyRoleGuard(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error(['UNAUTHORIZED'], 'Authentication required'));
    }

    if (!req.user.roles || !roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json(error(['INSUFFICIENT_PERMISSIONS'], `One of these roles required: ${roles.join(', ')}`));
    }

    next();
  };
}

module.exports = {
  roleGuard,
  adminGuard,
  anyRoleGuard,
};
