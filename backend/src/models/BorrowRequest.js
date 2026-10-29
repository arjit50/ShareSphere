const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester reference is required'],
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
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (val) {
          return !this.startDate || val > this.startDate;
        },
        message: 'End date must be strictly after start date',
      },
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled'],
        message: '{VALUE} is not a valid request status',
      },
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Response message cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user workflows and scheduling queries
borrowRequestSchema.index({ item: 1, status: 1 });
borrowRequestSchema.index({ requester: 1, status: 1 });
borrowRequestSchema.index({ owner: 1, status: 1 });
borrowRequestSchema.index({ item: 1, startDate: 1, endDate: 1 });

const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema);
module.exports = BorrowRequest;
