const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { categoryValidator } = require('../validators/validators');

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, categoryValidator, validate, createCategory);
router.put('/:id', protect, categoryValidator, validate, updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
