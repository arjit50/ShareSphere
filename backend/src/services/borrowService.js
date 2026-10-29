const BorrowRequest = require('../models/BorrowRequest');
const Loan = require('../models/Loan');
const Item = require('../models/Item');

class BorrowService {
  /**
   * Check if an item is available for a requested [startDate, endDate) interval.
   * Simple validation check using MongoDB findOne queries.
   */
  static async checkDateAvailability(itemId, startDate, endDate, excludeRequestId = null) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    // 1. Check existing active or approved loans for overlapping dates
    const loanConflict = await Loan.findOne({
      item: itemId,
      status: { $in: ['approved', 'active'] },
      startDate: { $lt: eDate },
      dueDate: { $gt: sDate },
    }).lean();

    if (loanConflict) {
      return {
        available: false,
        reason: 'Item is already on an active loan or reservation during this period.',
        conflictingLoan: loanConflict._id,
      };
    }

    // 2. Check approved borrow requests for overlapping dates
    const requestFilter = {
      item: itemId,
      status: 'approved',
      startDate: { $lt: eDate },
      endDate: { $gt: sDate },
    };
    if (excludeRequestId) {
      requestFilter._id = { $ne: excludeRequestId };
    }

    const approvedConflict = await BorrowRequest.findOne(requestFilter).lean();
    if (approvedConflict) {
      return {
        available: false,
        reason: 'Another reservation has already been approved for these dates.',
        conflictingRequest: approvedConflict._id,
      };
    }

    return { available: true };
  }

  /**
   * Create a new borrow request
   * MongoDB CRUD: Create operation using BorrowRequest.create()
   */
  static async createBorrowRequest(requesterId, { itemId, startDate, endDate, message }) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Basic date validations
    if (sDate < today) {
      throw new Error('Start date cannot be in the past');
    }
    if (eDate <= sDate) {
      throw new Error('End date must be strictly after start date');
    }

    // MongoDB Read: find item by ID
    const item = await Item.findOne({ _id: itemId, isDeleted: false });
    if (!item) {
      throw new Error('Item not found or has been removed');
    }

    // Business rule: users cannot borrow their own items
    if (item.owner.toString() === requesterId.toString()) {
      throw new Error('You cannot borrow your own item');
    }

    if (['maintenance', 'retired'].includes(item.availabilityStatus)) {
      throw new Error(`Item is currently not available for borrowing (status: ${item.availabilityStatus})`);
    }

    // Check date interval availability
    const availability = await this.checkDateAvailability(itemId, sDate, eDate);
    if (!availability.available) {
      throw new Error(availability.reason);
    }

    // Prevent duplicate pending requests from same user for same item
    const existingPending = await BorrowRequest.findOne({
      item: itemId,
      requester: requesterId,
      status: 'pending',
    });
    if (existingPending) {
      throw new Error('You already have a pending borrow request for this item');
    }

    // MongoDB Create: insert new borrow request document
    const request = await BorrowRequest.create({
      item: itemId,
      requester: requesterId,
      owner: item.owner,
      startDate: sDate,
      endDate: eDate,
      message: message || '',
      status: 'pending',
    });

    return request;
  }

  /**
   * Owner approves or declines a request.
   * If approved: updates request status, creates a new Loan document, and updates item status.
   */
  static async respondToRequest(requestId, ownerId, status, responseMessage = '') {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error("Status must be either 'approved' or 'rejected'");
    }

    // MongoDB Read with populate to load item details
    const borrowRequest = await BorrowRequest.findById(requestId).populate('item');
    if (!borrowRequest) {
      throw new Error('Borrow request not found');
    }

    // Authorization: only the item owner can respond
    if (borrowRequest.owner.toString() !== ownerId.toString()) {
      throw new Error('Only the item owner can respond to this borrow request');
    }

    if (borrowRequest.status !== 'pending') {
      throw new Error(`Cannot respond to a request with status '${borrowRequest.status}'`);
    }

    // Rejection flow
    if (status === 'rejected') {
      borrowRequest.status = 'rejected';
      borrowRequest.respondedAt = new Date();
      borrowRequest.responseMessage = responseMessage;
      await borrowRequest.save();

      return { request: borrowRequest, loan: null };
    }

    // Approval flow: check availability one more time
    const check = await this.checkDateAvailability(
      borrowRequest.item._id,
      borrowRequest.startDate,
      borrowRequest.endDate,
      borrowRequest._id
    );
    if (!check.available) {
      throw new Error(`Cannot approve request: ${check.reason}`);
    }

    // 1. Update borrow request status to 'approved'
    borrowRequest.status = 'approved';
    borrowRequest.respondedAt = new Date();
    borrowRequest.responseMessage = responseMessage;
    await borrowRequest.save();

    // 2. Create the associated Loan document using ObjectId references
    const newLoan = await Loan.create({
      borrowRequest: borrowRequest._id,
      item: borrowRequest.item._id,
      borrower: borrowRequest.requester,
      owner: borrowRequest.owner,
      startDate: borrowRequest.startDate,
      dueDate: borrowRequest.endDate,
      status: 'approved',
    });

    // 3. Update item status to 'reserved' using findByIdAndUpdate
    await Item.findByIdAndUpdate(borrowRequest.item._id, {
      $set: { availabilityStatus: 'reserved' },
    });

    // 4. Automatically decline any other conflicting pending requests for overlapping dates
    const conflictingPending = await BorrowRequest.find({
      _id: { $ne: borrowRequest._id },
      item: borrowRequest.item._id,
      status: 'pending',
      startDate: { $lt: borrowRequest.endDate },
      endDate: { $gt: borrowRequest.startDate },
    });

    for (const req of conflictingPending) {
      req.status = 'rejected';
      req.respondedAt = new Date();
      req.responseMessage = 'Item was reserved by another approved borrower for overlapping dates.';
      await req.save();
    }

    return { request: borrowRequest, loan: newLoan };
  }

  /**
   * Requester cancels their pending request
   * MongoDB Update: update status to 'cancelled'
   */
  static async cancelRequest(requestId, requesterId) {
    const borrowRequest = await BorrowRequest.findById(requestId).populate('item');
    if (!borrowRequest) {
      throw new Error('Borrow request not found');
    }

    // Only requester can cancel their own request
    if (borrowRequest.requester.toString() !== requesterId.toString()) {
      throw new Error('Only the requester can cancel their request');
    }

    if (borrowRequest.status !== 'pending') {
      throw new Error(`Cannot cancel request with status '${borrowRequest.status}'. Only pending requests can be cancelled.`);
    }

    borrowRequest.status = 'cancelled';
    await borrowRequest.save();

    return borrowRequest;
  }
}

module.exports = BorrowService;
