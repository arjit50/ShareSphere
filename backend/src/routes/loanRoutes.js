const express = require('express');
const router = express.Router();
const {
  getMyLoans,
  getLoanById,
  startPickup,
  checkOverdue,
} = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-loans', protect, getMyLoans);
router.get('/:id', protect, getLoanById);
router.patch('/:id/pickup', protect, startPickup);
router.post('/check-overdue', protect, checkOverdue);

module.exports = router;
