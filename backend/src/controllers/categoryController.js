const Category = require('../models/Category');
const Item = require('../models/Item');
const ApiResponse = require('../utils/apiResponse');

// Helper to slugify string
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

// @desc    Get all categories with item counts
// @route   GET /api/v1/categories
// @access  Public
const getAllCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Aggregate active item count for each category
    const itemCounts = await Item.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    itemCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      itemCount: countMap[cat._id.toString()] || 0,
    }));

    return ApiResponse.success(res, enrichedCategories);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by slug
// @route   GET /api/v1/categories/:slug
// @access  Public
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }
    return ApiResponse.success(res, category);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, displayOrder } = req.body;
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return ApiResponse.error(res, 'Category with this name or slug already exists', 400);
    }

    const category = await Category.create({
      name,
      slug,
      description,
      icon: icon || 'Layers',
      displayOrder: displayOrder || 0,
    });

    return ApiResponse.created(res, category, 'Category created successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;
    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (description) updates.description = description;
    if (icon) updates.icon = icon;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }

    return ApiResponse.success(res, category, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    // Check if any items belong to this category
    const itemCount = await Item.countDocuments({
      category: req.params.id,
      isDeleted: false,
    });

    if (itemCount > 0) {
      return ApiResponse.error(
        res,
        `Cannot delete category. There are ${itemCount} active items associated with it.`,
        400
      );
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return ApiResponse.error(res, 'Category not found', 404);
    }

    return ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
