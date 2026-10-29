const mongoose = require('mongoose');

const imageSubSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    publicId: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const locationSubSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      default: 'Greenwood',
    },
    area: {
      type: String,
      trim: true,
      default: 'Downtown',
    },
    postalCode: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Item must have an owner'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Item must belong to a category'],
      index: true,
    },
    images: {
      type: [imageSubSchema],
      validate: {
        validator: function (val) {
          return val.length <= 6;
        },
        message: 'An item cannot have more than 6 images',
      },
      default: [],
    },
    condition: {
      type: String,
      enum: {
        values: ['new', 'like-new', 'good', 'fair'],
        message: '{VALUE} is not a valid condition',
      },
      required: [true, 'Item condition is required'],
      default: 'good',
      index: true,
    },
    replacementValue: {
      type: Number,
      required: [true, 'Estimated replacement value is required'],
      min: [0, 'Replacement value cannot be negative'],
    },
    location: {
      type: locationSubSchema,
      required: true,
      default: () => ({ city: 'Greenwood', area: 'Downtown', postalCode: '' }),
    },
    availabilityStatus: {
      type: String,
      enum: {
        values: ['available', 'borrowed', 'reserved', 'maintenance', 'retired'],
        message: '{VALUE} is not a valid availability status',
      },
      default: 'available',
      index: true,
    },
    borrowingInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Borrowing instructions cannot exceed 1000 characters'],
      default: 'Handle with care. Return clean and in original condition.',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be greater than 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBorrows: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries and filtering
itemSchema.index({ category: 1, availabilityStatus: 1, isDeleted: 1 });
itemSchema.index({ owner: 1, isDeleted: 1 });
itemSchema.index({ availabilityStatus: 1, 'location.city': 1 });
itemSchema.index({ averageRating: -1, totalReviews: -1 });

// Full-text index for flexible search by keyword
itemSchema.index(
  {
    title: 'text',
    description: 'text',
    'location.city': 'text',
    'location.area': 'text',
  },
  {
    weights: {
      title: 5,
      'location.city': 2,
      description: 1,
    },
    name: 'ItemTextIndex',
  }
);

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
