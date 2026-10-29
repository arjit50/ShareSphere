const express = require('express');
const router = express.Router();
const {
  processReturn,
  getReturnByLoan,
  getAllReturns,
} = require('../controllers/returnController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { returnCreateValidator } = require('../validators/validators');

router.post('/:loanId', protect, returnCreateValidator, validate, processReturn);
router.get('/loan/:loanId', protect, getReturnByLoan);
router.get('/', protect, getAllReturns);

module.exports = router;
