const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers in dev mode
  if (process.env.NODE_ENV !== 'production') {
    console.error(' [Error Middleware Captured]:', err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of '${err.value}'`;
    return ApiResponse.error(res, message, 404);
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    let message = `Duplicate value '${value}' entered for ${field}. Please use another value.`;
    if (field === 'loan' && err.keyValue?.reviewer) {
      message = 'You have already submitted a review for this loan transaction.';
    }
    return ApiResponse.error(res, message, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return ApiResponse.error(res, 'Validation Error', 400, messages);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired', 401);
  }

  const statusCode = error.statusCode || err.status || 500;
  return ApiResponse.error(res, error.message || 'Server Error', statusCode);
};

const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
