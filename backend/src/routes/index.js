const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const itemRoutes = require('./itemRoutes');
const borrowRequestRoutes = require('./borrowRequestRoutes');
const loanRoutes = require('./loanRoutes');
const returnRoutes = require('./returnRoutes');
const damageReportRoutes = require('./damageReportRoutes');
const reviewRoutes = require('./reviewRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ShareSphere API v1',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/items', itemRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/loans', loanRoutes);
router.use('/returns', returnRoutes);
router.use('/damage-reports', damageReportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin/analytics', analyticsRoutes);

module.exports = router;
