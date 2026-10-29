const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan reference is required'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
      index: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee reference is required'],
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
      index: true,
    },
    reviewDirection: {
      type: String,
      enum: {
        values: ['borrower_to_owner', 'owner_to_borrower'],
        message: '{VALUE} is not a valid review direction',
      },
      required: [true, 'Review direction is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// STRICT COMPOUND UNIQUE INDEX: A user can only review once per loan
reviewSchema.index({ loan: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ item: 1, rating: -1 });

// Static method to recalculate item average rating using MongoDB Aggregation Pipeline
reviewSchema.statics.calculateAverageRating = async function (itemId) {
  const stats = await this.aggregate([
    {
      $match: {
        item: new mongoose.Types.ObjectId(itemId),
        reviewDirection: 'borrower_to_owner',
      },
    },
    {
      $group: {
        _id: '$item',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Item').findByIdAndUpdate(itemId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await mongoose.model('Item').findByIdAndUpdate(itemId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

// Post save and remove hooks to update item rating
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.item);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
