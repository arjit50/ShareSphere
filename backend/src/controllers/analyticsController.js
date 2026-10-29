const AnalyticsService = require('../services/analyticsService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get platform analytics (overview counts, category stats, popular items, borrowing stats)
// @route   GET /api/v1/admin/analytics/admin or /api/v1/admin/analytics/metrics
// @access  Private
const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getAdminDashboardAnalytics();
    return ApiResponse.success(res, data, 'Analytics data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrowing history for logged-in member
// @route   GET /api/v1/admin/analytics/history/me
// @access  Private
const getUserBorrowingHistory = async (req, res, next) => {
  try {
    const history = await AnalyticsService.getUserBorrowingHistory(req.user._id);
    return ApiResponse.success(res, history, 'Borrowing history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Simplified explain info (for college project demonstration)
// @route   GET /api/v1/admin/analytics/explain
// @access  Private
const getExplainPerformance = async (req, res, next) => {
  try {
    return ApiResponse.success(res, {
      message: 'MongoDB indexes are configured for efficient queries (e.g., text search on items, unique on user emails).',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggregated report for items and borrowing stats
// @route   GET /api/v1/admin/analytics/lookup-report
// @access  Private
const getLookupReport = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getAdminDashboardAnalytics();
    return ApiResponse.success(res, data.popularItems, 'Popular items lookup report');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getUserBorrowingHistory,
  getExplainPerformance,
  getLookupReport,
};
