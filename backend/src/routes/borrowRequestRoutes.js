const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  createRequest,
  getMyRequests,
  getIncomingRequests,
  respondToRequest,
  cancelRequest,
} = require('../controllers/borrowRequestController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { borrowRequestCreateValidator } = require('../validators/validators');

router.get('/check-availability', checkAvailability);
router.post('/', protect, borrowRequestCreateValidator, validate, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/incoming', protect, getIncomingRequests);
router.patch('/:id/respond', protect, respondToRequest);
router.patch('/:id/cancel', protect, cancelRequest);

module.exports = router;
