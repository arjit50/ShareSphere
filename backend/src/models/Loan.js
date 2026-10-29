const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    borrowRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowRequest',
      required: [true, 'Originating borrow request reference is required'],
      unique: true,
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
      index: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Borrower reference is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Loan start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Loan due date is required'],
      index: true,
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['approved', 'active', 'returned', 'overdue', 'cancelled'],
        message: '{VALUE} is not a valid loan status',
      },
      default: 'approved',
      index: true,
    },
    pickupNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Pickup notes cannot exceed 500 characters'],
      default: '',
    },
    returnNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Return notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for active query patterns and tracking
loanSchema.index({ borrower: 1, status: 1 });
loanSchema.index({ owner: 1, status: 1 });
loanSchema.index({ item: 1, status: 1 });
loanSchema.index({ status: 1, dueDate: 1 });

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
