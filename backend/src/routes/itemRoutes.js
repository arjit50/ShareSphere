const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  itemCreateValidator,
  itemUpdateValidator,
} = require('../validators/validators');

router.get('/', getAllItems);
router.get('/me', protect, getMyItems);
router.get('/:id', getItemById);
router.post('/', protect, itemCreateValidator, validate, createItem);
router.put('/:id', protect, itemUpdateValidator, validate, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
