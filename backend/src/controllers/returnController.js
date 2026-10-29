const Return = require('../models/Return');
const LoanService = require('../services/loanService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Process item return
// @route   POST /api/v1/returns/:loanId
// @access  Private
const processReturn = async (req, res, next) => {
  try {
    const { conditionOnReturn = 'same', notes = '' } = req.body;
    const result = await LoanService.processReturn(req.params.loanId, req.user._id, {
      conditionOnReturn,
      notes,
    });

    return ApiResponse.created(res, result, 'Item return processed and recorded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get return record by loan ID
// @route   GET /api/v1/returns/loan/:loanId
// @access  Private
const getReturnByLoan = async (req, res, next) => {
  try {
    const returnRecord = await Return.findOne({ loan: req.params.loanId })
      .populate('returnedBy', 'name email avatar')
      .populate('item', 'title images')
      .lean();

    if (!returnRecord) {
      return ApiResponse.error(res, 'Return record not found for this loan', 404);
    }

    return ApiResponse.success(res, returnRecord);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all returns (Admin)
// @route   GET /api/v1/returns
// @access  Private/Admin
const getAllReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, condition, lateOnly } = req.query;
    const filter = {};
    if (condition) filter.conditionOnReturn = condition;
    if (lateOnly === 'true') filter.lateReturn = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [returns, total] = await Promise.all([
      Return.find(filter)
        .populate('returnedBy', 'name email avatar')
        .populate('item', 'title images')
        .sort({ actualReturnDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Return.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, returns, total, page, limit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processReturn,
  getReturnByLoan,
  getAllReturns,
};
