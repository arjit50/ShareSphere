const Loan = require('../models/Loan');
const Return = require('../models/Return');
const Item = require('../models/Item');

class LoanService {
  /**
   * Mark an approved loan as 'active' (Item picked up by borrower)
   * MongoDB Update: updates loan status and item availability status
   */
  static async startPickup(loanId, userId) {
    const loan = await Loan.findById(loanId).populate('item');
    if (!loan) {
      throw new Error('Loan record not found');
    }

    // Both owner and borrower can confirm pickup
    const isOwner = loan.owner.toString() === userId.toString();
    const isBorrower = loan.borrower.toString() === userId.toString();

    if (!isOwner && !isBorrower) {
      throw new Error('Unauthorized to confirm pickup for this loan');
    }

    if (loan.status !== 'approved') {
      throw new Error(`Cannot start loan pickup from status '${loan.status}'. Expected 'approved'.`);
    }

    // 1. Update Loan document
    loan.status = 'active';
    loan.borrowedAt = new Date();
    await loan.save();

    // 2. Increment item total borrows and set availabilityStatus to 'borrowed'
    await Item.findByIdAndUpdate(loan.item._id, {
      $set: { availabilityStatus: 'borrowed' },
      $inc: { totalBorrows: 1 },
    });

    return loan;
  }

  /**
   * Process item return
   * MongoDB Operations:
   * 1. Creates a new Return record in 'returns' collection
   * 2. Updates Loan document status to 'returned'
   * 3. Updates Item availability back to 'available' (or 'maintenance' if damaged)
   */
  static async processReturn(loanId, userId, { conditionOnReturn = 'same', notes = '' }) {
    const loan = await Loan.findById(loanId).populate('item');
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Only borrower or owner can record return
    const isBorrower = loan.borrower.toString() === userId.toString();
    const isOwner = loan.owner.toString() === userId.toString();

    if (!isBorrower && !isOwner) {
      throw new Error('Only the borrower or owner can record a return for this loan');
    }

    if (!['approved', 'active', 'overdue'].includes(loan.status)) {
      throw new Error(`Cannot return item for loan with status '${loan.status}'`);
    }

    const actualReturnDate = new Date();
    const isLate = actualReturnDate > new Date(loan.dueDate);
    const msDiff = actualReturnDate - new Date(loan.dueDate);
    const daysLate = isLate ? Math.ceil(msDiff / (1000 * 60 * 60 * 24)) : 0;

    // 1. Create Return record in returns collection
    const newReturn = await Return.create({
      loan: loan._id,
      returnedBy: userId,
      item: loan.item._id,
      actualReturnDate,
      conditionOnReturn,
      notes,
      lateReturn: isLate,
      daysLate,
    });

    // 2. Update Loan document status to 'returned'
    loan.status = 'returned';
    loan.returnedAt = actualReturnDate;
    loan.returnNotes = notes;
    await loan.save();

    // 3. Update Item status back to 'available' (or 'maintenance' if damaged)
    const newAvailability = conditionOnReturn === 'damaged' ? 'maintenance' : 'available';
    await Item.findByIdAndUpdate(loan.item._id, {
      $set: { availabilityStatus: newAvailability },
    });

    return { loan, returnRecord: newReturn };
  }

  /**
   * Check active loans against current time and flag overdue loans.
   * Demonstrates simple MongoDB find and updateMany.
   */
  static async checkAndMarkOverdueLoans() {
    const now = new Date();

    // Find active loans that are past their due date
    const overdueLoans = await Loan.find({
      status: 'active',
      dueDate: { $lt: now },
    }).populate('item borrower');

    if (overdueLoans.length === 0) {
      return { count: 0, updatedIds: [] };
    }

    const ids = overdueLoans.map((l) => l._id);

    // Update all matching loans to 'overdue' using updateMany
    await Loan.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'overdue' } }
    );

    return { count: ids.length, updatedIds: ids };
  }
}

module.exports = LoanService;
