const Review = require('../models/Review');
const Loan = require('../models/Loan');
const ApiResponse = require('../utils/apiResponse');

// @desc    Submit a review for a completed loan
// @route   POST /api/v1/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { loan: loanId, rating, comment } = req.body;

    const loan = await Loan.findById(loanId).populate('item');
    if (!loan) {
      return ApiResponse.error(res, 'Loan record not found', 404);
    }

    // Must be returned to review
    if (loan.status !== 'returned') {
      return ApiResponse.error(
        res,
        `Reviews can only be submitted for completed loans (current status: ${loan.status})`,
        400
      );
    }

    const isBorrower = loan.borrower.toString() === req.user._id.toString();
    const isOwner = loan.owner.toString() === req.user._id.toString();

    if (!isBorrower && !isOwner) {
      return ApiResponse.error(res, 'You are not a participant in this loan', 403);
    }

    // Check if user has already reviewed this loan
    const existingReview = await Review.findOne({
      loan: loan._id,
      reviewer: req.user._id,
    });
    if (existingReview) {
      return ApiResponse.error(res, 'You have already submitted a review for this loan transaction', 400);
    }

    const reviewee = isBorrower ? loan.owner : loan.borrower;
    const reviewDirection = isBorrower ? 'borrower_to_owner' : 'owner_to_borrower';

    const review = await Review.create({
      loan: loan._id,
      reviewer: req.user._id,
      reviewee,
      item: loan.item._id,
      reviewDirection,
      rating: Number(rating),
      comment: comment || '',
    });



    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name avatar')
      .populate('item', 'title');

    return ApiResponse.created(res, populatedReview, 'Review submitted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a specific item
// @route   GET /api/v1/reviews/item/:itemId
// @access  Public
const getItemReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId })
      .populate('reviewer', 'name avatar address.city')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews received by a user
// @route   GET /api/v1/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('item', 'title images')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, reviews);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getItemReviews,
  getUserReviews,
};
