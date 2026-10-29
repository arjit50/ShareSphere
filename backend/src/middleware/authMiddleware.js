const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Protect routes: verify JWT from cookies and check user status
 */
const protect = async (req, res, next) => {
  let token;

  // Primary: extract JWT token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized, no authentication cookie provided', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return ApiResponse.error(res, 'The user belonging to this token no longer exists', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'User account is deactivated. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return ApiResponse.error(res, 'Not authorized, invalid token signature', 401);
  }
};

/**
 * Generic authorization pass-through: single role system
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // In single-role architecture, any authenticated user has full access
    next();
  };
};

/**
 * Optional authentication: loads user if cookie token present, continues if not
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Continue without user
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
