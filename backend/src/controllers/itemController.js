const Item = require('../models/Item');
const Category = require('../models/Category');
const Review = require('../models/Review');
const ApiResponse = require('../utils/apiResponse');

// Fallback high quality placeholder images based on category or generic
const getPlaceholderImage = (title) => {
  return [
    {
      url: `https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80`,
      isPrimary: true,
      caption: title,
    },
  ];
};

// @desc    Get all items with full-text search, filters, sorting, and pagination
// @route   GET /api/v1/items
// @access  Public
const getAllItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      condition,
      status = 'available',
      city,
      sort = 'newest',
      minRating,
    } = req.query;

    const filter = { isDeleted: false };

    // Availability status filter (default: available or all non-retired)
    if (status === 'all') {
      filter.availabilityStatus = { $ne: 'retired' };
    } else if (status) {
      filter.availabilityStatus = status;
    }

    // Category filter by ID or by slug
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const foundCategory = await Category.findOne({ slug: category });
        if (foundCategory) {
          filter.category = foundCategory._id;
        }
      }
    }

    // Condition filter
    if (condition) {
      filter.condition = condition;
    }

    // City / Location filter
    if (city) {
      filter['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    // Minimum rating filter
    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    // Full-Text search or regex search
    let projection = null;
    let sortOptions = {};

    if (search && search.trim()) {
      // Use MongoDB full-text index
      filter.$text = { $search: search.trim() };
      projection = { score: { $meta: 'textScore' } };
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      // Sorting
      switch (sort) {
        case 'rating':
          sortOptions = { averageRating: -1, totalReviews: -1 };
          break;
        case 'popular':
          sortOptions = { totalBorrows: -1, averageRating: -1 };
          break;
        case 'value-asc':
          sortOptions = { replacementValue: 1 };
          break;
        case 'value-desc':
          sortOptions = { replacementValue: -1 };
          break;
        case 'newest':
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const query = Item.find(filter, projection)
      .populate('owner', 'name avatar address.city')
      .populate('category', 'name slug icon')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const [items, total] = await Promise.all([query, Item.countDocuments(filter)]);

    return ApiResponse.paginated(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item by ID
// @route   GET /api/v1/items/:id
// @access  Public
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name email avatar address phone createdAt')
      .populate('category', 'name slug icon description')
      .lean();

    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    // Fetch reviews for this item
    const reviews = await Review.find({ item: item._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch up to 3 other items by the same owner
    const ownerOtherItems = await Item.find({
      owner: item.owner._id,
      _id: { $ne: item._id },
      isDeleted: false,
    })
      .limit(3)
      .lean();

    return ApiResponse.success(res, {
      item,
      reviews,
      ownerOtherItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new item
// @route   POST /api/v1/items
// @access  Private
const createItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      replacementValue,
      location,
      borrowingInstructions,
      images,
    } = req.body;

    // Use default location from user profile if not provided
    const itemLocation = location || {
      city: req.user.address?.city || 'Greenwood',
      area: req.user.address?.area || 'Downtown',
      postalCode: req.user.address?.postalCode || '',
    };

    // Fallback images if user hasn't provided any
    const itemImages =
      images && images.length > 0 ? images : getPlaceholderImage(title);

    const item = await Item.create({
      title,
      description,
      owner: req.user._id,
      category,
      condition,
      replacementValue,
      location: itemLocation,
      borrowingInstructions: borrowingInstructions || undefined,
      images: itemImages,
      availabilityStatus: 'available',
    });

    const populatedItem = await Item.findById(item._id)
      .populate('category', 'name slug icon')
      .populate('owner', 'name avatar');

    return ApiResponse.created(res, populatedItem, 'Item listed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update item
// @route   PUT /api/v1/items/:id
// @access  Private
const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    // Only owner or admin can update
    const isOwner = item.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return ApiResponse.error(res, 'Not authorized to modify this listing', 403);
    }

    const {
      title,
      description,
      category,
      condition,
      replacementValue,
      location,
      borrowingInstructions,
      availabilityStatus,
      images,
    } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (condition) updates.condition = condition;
    if (replacementValue !== undefined) updates.replacementValue = replacementValue;
    if (location) updates.location = location;
    if (borrowingInstructions !== undefined) updates.borrowingInstructions = borrowingInstructions;
    if (availabilityStatus) updates.availabilityStatus = availabilityStatus;
    if (images) updates.images = images;

    const updatedItem = await Item.findByIdAndUpdate(
      item._id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug icon')
      .populate('owner', 'name avatar');

    return ApiResponse.success(res, updatedItem, 'Item updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete item
// @route   DELETE /api/v1/items/:id
// @access  Private
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    const isOwner = item.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return ApiResponse.error(res, 'Not authorized to delete this listing', 403);
    }

    // Soft delete preserves loan history integrity
    item.isDeleted = true;
    item.availabilityStatus = 'retired';
    await item.save();

    return ApiResponse.success(res, null, 'Item listing removed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user's listed items
// @route   GET /api/v1/items/me
// @access  Private
const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id, isDeleted: false })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 })
      .lean();

    return ApiResponse.success(res, items);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
};
