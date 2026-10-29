const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Auth Validators
const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone').optional().trim(),
  body('address.city').optional().trim(),
];

const loginValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('phone').optional().trim(),
  body('address').optional().isObject(),
  body('avatar').optional().trim(),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

// Item Validators
const itemCreateValidator = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be between 3 and 120 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('category').custom(isObjectId).withMessage('Valid category ID is required'),
  body('condition').isIn(['new', 'like-new', 'good', 'fair']).withMessage('Invalid condition selected'),
  body('replacementValue').isFloat({ min: 0 }).withMessage('Replacement value must be a positive number'),
  body('borrowingInstructions').optional().trim().isLength({ max: 1000 }),
  body('images').optional().isArray({ max: 6 }).withMessage('Images must be an array of maximum 6 items'),
  body('location.city').optional().trim().notEmpty().withMessage('City cannot be empty'),
];

const itemUpdateValidator = [
  param('id').custom(isObjectId).withMessage('Invalid Item ID format'),
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }),
  body('category').optional().custom(isObjectId),
  body('condition').optional().isIn(['new', 'like-new', 'good', 'fair']),
  body('replacementValue').optional().isFloat({ min: 0 }),
  body('availabilityStatus').optional().isIn(['available', 'borrowed', 'reserved', 'maintenance', 'retired']),
];

// Borrow Request Validators
const borrowRequestCreateValidator = [
  body('item').custom(isObjectId).withMessage('Valid item ID is required'),
  body('startDate').isISO8601().toDate().withMessage('Valid start date (ISO8601) is required'),
  body('endDate').isISO8601().toDate().withMessage('Valid end date (ISO8601) is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be strictly after start date');
      }
      return true;
    }),
  body('message').optional().trim().isLength({ max: 500 }),
];

// Return Validators
const returnCreateValidator = [
  body('conditionOnReturn').isIn(['same', 'minor_wear', 'damaged']).withMessage('Valid return condition required'),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

// Damage Report Validators
const damageReportCreateValidator = [
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('damageType').isIn(['cosmetic', 'functional', 'broken', 'lost_parts']).withMessage('Invalid damage type'),
  body('severity').isIn(['low', 'medium', 'high', 'total_loss']).withMessage('Invalid severity level'),
  body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be positive'),
];

// Review Validators
const reviewCreateValidator = [
  body('loan').custom(isObjectId).withMessage('Valid loan ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

// Category Validators
const categoryValidator = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
  body('description').trim().isLength({ min: 5, max: 300 }).withMessage('Description must be between 5 and 300 characters'),
  body('icon').optional().trim(),
];

module.exports = {
  isObjectId,
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  itemCreateValidator,
  itemUpdateValidator,
  borrowRequestCreateValidator,
  returnCreateValidator,
  damageReportCreateValidator,
  reviewCreateValidator,
  categoryValidator,
};
