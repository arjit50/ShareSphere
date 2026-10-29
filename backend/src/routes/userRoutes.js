const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getPublicUserProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/public/:id', getPublicUserProfile);
router.get('/:id', protect, getUserById);

module.exports = router;
