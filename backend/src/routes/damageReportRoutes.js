const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
} = require('../controllers/damageReportController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { damageReportCreateValidator } = require('../validators/validators');

router.post('/', protect, damageReportCreateValidator, validate, createReport);
router.get('/', protect, getReports);
router.get('/:id', protect, getReportById);
router.patch('/:id/resolution', protect, updateReportStatus);

module.exports = router;
