const User = require('../models/User');
const Item = require('../models/Item');
const Review = require('../models/Review');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }
    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/v1/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['member', 'admin'].includes(role)) {
      return ApiResponse.error(res, 'Invalid role provided', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, user, `User role changed to ${role}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Admin only)
// @route   PATCH /api/v1/users/:id/status
// @access  Private/Admin
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return ApiResponse.success(
      res,
      user,
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get public user profile & their listed items
// @route   GET /api/v1/users/:id/public
// @access  Public
const getPublicUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar address.city address.state createdAt'
    );
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    const [items, reviews] = await Promise.all([
      Item.find({ owner: user._id, isDeleted: false })
        .populate('category', 'name icon slug')
        .sort({ createdAt: -1 })
        .lean(),
      Review.find({ reviewee: user._id })
        .populate('reviewer', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return ApiResponse.success(res, {
      user,
      items,
      reviews,
      reputation: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  getPublicUserProfile,
};
