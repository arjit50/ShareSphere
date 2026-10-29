const DamageReport = require('../models/DamageReport');
const Loan = require('../models/Loan');
const Item = require('../models/Item');
const ApiResponse = require('../utils/apiResponse');

// @desc    Submit a new damage report
// @route   POST /api/v1/damage-reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    const { loan: loanId, description, damageType, severity, evidenceImages, estimatedCost } = req.body;

    const loan = await Loan.findById(loanId).populate('item');
    if (!loan) {
      return ApiResponse.error(res, 'Loan record not found', 404);
    }

    // Must be borrower or owner of the loan
    const isBorrower = loan.borrower.toString() === req.user._id.toString();
    const isOwner = loan.owner.toString() === req.user._id.toString();

    if (!isBorrower && !isOwner) {
      return ApiResponse.error(res, 'Not authorized to report damage on this loan', 403);
    }

    const report = await DamageReport.create({
      loan: loan._id,
      item: loan.item._id,
      reportedBy: req.user._id,
      description,
      damageType,
      severity,
      evidenceImages: evidenceImages || [],
      estimatedCost: estimatedCost || 0,
      status: 'open',
    });

    // Update item status to 'maintenance'
    await Item.findByIdAndUpdate(loan.item._id, {
      $set: { availabilityStatus: 'maintenance' },
    });



    return ApiResponse.created(res, report, 'Damage report submitted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get damage reports for current user's loans / items
// @route   GET /api/v1/damage-reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Find loans user is part of
    const userLoans = await Loan.find({
      $or: [{ borrower: req.user._id }, { owner: req.user._id }],
    }).select('_id');
    const loanIds = userLoans.map((l) => l._id);

    const filter = {
      $or: [{ reportedBy: req.user._id }, { loan: { $in: loanIds } }],
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      DamageReport.find(filter)
        .populate('item', 'title images condition')
        .populate('reportedBy', 'name email avatar')
        .populate('loan', 'startDate dueDate status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      DamageReport.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, reports, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single damage report
// @route   GET /api/v1/damage-reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await DamageReport.findById(req.params.id)
      .populate('item')
      .populate('reportedBy', 'name email avatar phone')
      .populate('loan')
      .lean();

    if (!report) {
      return ApiResponse.error(res, 'Damage report not found', 404);
    }

    return ApiResponse.success(res, report);
  } catch (error) {
    next(error);
  }
};

// @desc    Update damage report status & resolution
// @route   PATCH /api/v1/damage-reports/:id/resolution
// @access  Private
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes, estimatedCost } = req.body;

    const report = await DamageReport.findById(req.params.id).populate('item');
    if (!report) {
      return ApiResponse.error(res, 'Damage report not found', 404);
    }

    if (status) report.status = status;
    if (resolutionNotes) report.resolutionNotes = resolutionNotes;
    if (estimatedCost !== undefined) report.estimatedCost = estimatedCost;

    if (status === 'resolved' || status === 'rejected') {
      report.resolvedAt = new Date();
      // If resolved or rejected, restore item availability to available unless retired
      await Item.findByIdAndUpdate(report.item._id, {
        $set: { availabilityStatus: 'available' },
      });
    }

    await report.save();



    return ApiResponse.success(res, report, 'Damage report status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
};
