const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Associated loan reference is required'],
      unique: true,
      index: true,
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Returned by user reference is required'],
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
      index: true,
    },
    actualReturnDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    conditionOnReturn: {
      type: String,
      enum: {
        values: ['same', 'minor_wear', 'damaged'],
        message: '{VALUE} is not a valid return condition',
      },
      default: 'same',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    lateReturn: {
      type: Boolean,
      default: false,
    },
    daysLate: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

returnSchema.index({ returnedBy: 1, actualReturnDate: -1 });

const Return = mongoose.model('Return', returnSchema);
module.exports = Return;
