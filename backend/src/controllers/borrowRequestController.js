const BorrowRequest = require('../models/BorrowRequest');
const BorrowService = require('../services/borrowService');
const ApiResponse = require('../utils/apiResponse');

// @desc    Check item availability for date range
// @route   GET /api/v1/borrow-requests/check-availability
// @access  Public
const checkAvailability = async (req, res, next) => {
  try {
    const { itemId, startDate, endDate } = req.query;
    if (!itemId || !startDate || !endDate) {
      return ApiResponse.error(res, 'itemId, startDate, and endDate are required', 400);
    }

    const result = await BorrowService.checkDateAvailability(itemId, startDate, endDate);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new borrow request
// @route   POST /api/v1/borrow-requests
// @access  Private
const createRequest = async (req, res, next) => {
  try {
    const { item: itemId, startDate, endDate, message } = req.body;

    const request = await BorrowService.createBorrowRequest(req.user._id, {
      itemId,
      startDate,
      endDate,
      message,
    });

    return ApiResponse.created(res, request, 'Borrow request submitted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests made by the current user
// @route   GET /api/v1/borrow-requests/my-requests
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { requester: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await BorrowRequest.find(filter)
      .populate('item', 'title images condition replacementValue location')
      .populate('owner', 'name email avatar address.city')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get incoming requests for items owned by current user
// @route   GET /api/v1/borrow-requests/incoming
// @access  Private
const getIncomingRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { owner: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await BorrowRequest.find(filter)
      .populate('item', 'title images condition replacementValue')
      .populate('requester', 'name email avatar address.city phone')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Owner approves or declines a request
// @route   PATCH /api/v1/borrow-requests/:id/respond
// @access  Private
const respondToRequest = async (req, res, next) => {
  try {
    const { status, responseMessage } = req.body;
    const result = await BorrowService.respondToRequest(
      req.params.id,
      req.user._id,
      status,
      responseMessage
    );

    return ApiResponse.success(
      res,
      result,
      `Request has been ${status === 'approved' ? 'approved and loan created' : 'declined'}`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Requester cancels pending request
// @route   PATCH /api/v1/borrow-requests/:id/cancel
// @access  Private
const cancelRequest = async (req, res, next) => {
  try {
    const cancelled = await BorrowService.cancelRequest(req.params.id, req.user._id);
    return ApiResponse.success(res, cancelled, 'Borrow request cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAvailability,
  createRequest,
  getMyRequests,
  getIncomingRequests,
  respondToRequest,
  cancelRequest,
};
