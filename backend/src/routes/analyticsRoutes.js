const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getUserBorrowingHistory,
  getExplainPerformance,
  getLookupReport,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/metrics', protect, getAdminDashboard);
router.get('/admin', protect, getAdminDashboard);
router.get('/explain', protect, getExplainPerformance);
router.get('/lookup-report', protect, getLookupReport);
router.get('/history/me', protect, getUserBorrowingHistory);

module.exports = router;
