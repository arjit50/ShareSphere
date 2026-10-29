const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Associated loan reference is required'],
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Associated item reference is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed damage description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    damageType: {
      type: String,
      enum: {
        values: ['cosmetic', 'functional', 'broken', 'lost_parts'],
        message: '{VALUE} is not a valid damage type',
      },
      required: [true, 'Damage type is required'],
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'total_loss'],
        message: '{VALUE} is not a valid severity level',
      },
      required: [true, 'Damage severity is required'],
      default: 'medium',
    },
    evidenceImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'under_review', 'resolved', 'rejected'],
        message: '{VALUE} is not a valid report status',
      },
      default: 'open',
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Estimated cost cannot be negative'],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

damageReportSchema.index({ item: 1, status: 1 });
damageReportSchema.index({ reportedBy: 1, status: 1 });

const DamageReport = mongoose.model('DamageReport', damageReportSchema);
module.exports = DamageReport;
