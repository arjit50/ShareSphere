const Loan = require('../models/Loan');
const Return = require('../models/Return');
const Review = require('../models/Review');
const LoanService = require('../services/loanService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user's loans (as borrower, owner, or all)
// @route   GET /api/v1/loans/my-loans
// @access  Private
const getMyLoans = async (req, res, next) => {
  try {
    const { type = 'all', status } = req.query;
    const filter = {};

    if (type === 'borrowed') {
      filter.borrower = req.user._id;
    } else if (type === 'lent') {
      filter.owner = req.user._id;
    } else {
      filter.$or = [{ borrower: req.user._id }, { owner: req.user._id }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('item', 'title images condition replacementValue location')
      .populate('borrower', 'name email avatar address.city phone')
      .populate('owner', 'name email avatar address.city phone')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, loans);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single loan by ID with related records
// @route   GET /api/v1/loans/:id
// @access  Private
const getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('item')
      .populate('borrower', 'name email avatar address phone')
      .populate('owner', 'name email avatar address phone')
      .lean();

    if (!loan) {
      return ApiResponse.error(res, 'Loan record not found', 404);
    }

    const isAuthorized =
      loan.borrower._id.toString() === req.user._id.toString() ||
      loan.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return ApiResponse.error(res, 'Not authorized to view this loan', 403);
    }

    const [returnRecord, reviews] = await Promise.all([
      Return.findOne({ loan: loan._id }).lean(),
      Review.find({ loan: loan._id }).populate('reviewer', 'name avatar').lean(),
    ]);

    return ApiResponse.success(res, {
      loan,
      returnRecord,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start pickup (mark loan active)
// @route   PATCH /api/v1/loans/:id/pickup
// @access  Private
const startPickup = async (req, res, next) => {
  try {
    const loan = await LoanService.startPickup(req.params.id, req.user._id);
    return ApiResponse.success(res, loan, 'Item pickup confirmed. Loan is now active.');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin or job trigger to evaluate overdue loans
// @route   POST /api/v1/loans/check-overdue
// @access  Private/Admin
const checkOverdue = async (req, res, next) => {
  try {
    const result = await LoanService.checkAndMarkOverdueLoans();
    return ApiResponse.success(res, result, `Evaluated overdue loans. ${result.count} marked overdue.`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLoans,
  getLoanById,
  startPickup,
  checkOverdue,
};
