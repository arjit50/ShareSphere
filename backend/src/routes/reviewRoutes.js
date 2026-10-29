const express = require('express');
const router = express.Router();
const {
  createReview,
  getItemReviews,
  getUserReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { reviewCreateValidator } = require('../validators/validators');

router.post('/', protect, reviewCreateValidator, validate, createReview);
router.get('/item/:itemId', getItemReviews);
router.get('/user/:userId', getUserReviews);

module.exports = router;
