const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const Loan = require('../models/Loan');
const BorrowRequest = require('../models/BorrowRequest');
const DamageReport = require('../models/DamageReport');
const Review = require('../models/Review');

class AnalyticsService {
  /**
   * Platform Analytics with simple, student-friendly MongoDB Aggregation Pipelines
   */
  static async getAdminDashboardAnalytics() {
    // 1. High-level counts using countDocuments()
    const [
      totalUsers,
      totalItems,
      totalLoans,
      activeLoans,
      overdueLoans,
      pendingRequests,
      openDamageReports,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Item.countDocuments({ isDeleted: false }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: { $in: ['approved', 'active'] } }),
      Loan.countDocuments({ status: 'overdue' }),
      BorrowRequest.countDocuments({ status: 'pending' }),
      DamageReport.countDocuments({ status: { $in: ['open', 'under_review'] } }),
    ]);

    // =========================================================================
    // AGGREGATION PIPELINE 1: Category-wise item counts
    // Demonstrates: $match, $group, $lookup, $unwind, $project, $sort
    // =========================================================================
    const categoryStats = await Item.aggregate([
      // Step 1: Filter out soft-deleted items
      { $match: { isDeleted: false } },
      // Step 2: Group by category ObjectId and calculate counts
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: [{ $eq: ['$availabilityStatus', 'available'] }, 1, 0] },
          },
          avgReplacementValue: { $avg: '$replacementValue' },
          totalValue: { $sum: '$replacementValue' },
          totalBorrows: { $sum: '$totalBorrows' },
        },
      },
      // Step 3: Join with categories collection to get the category name & icon
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      // Step 4: Flatten the categoryDetails array
      { $unwind: '$categoryDetails' },
      // Step 5: Format the output fields
      {
        $project: {
          _id: 1,
          name: '$categoryDetails.name',
          slug: '$categoryDetails.slug',
          icon: '$categoryDetails.icon',
          totalItems: 1,
          availableItems: 1,
          avgReplacementValue: { $round: ['$avgReplacementValue', 2] },
          totalValue: { $round: ['$totalValue', 2] },
          totalBorrows: 1,
        },
      },
      // Step 6: Sort categories with the most items first
      { $sort: { totalItems: -1 } },
    ]);

    // =========================================================================
    // AGGREGATION PIPELINE 2: Most borrowed items
    // Demonstrates: $group, $sort, $limit, $lookup, $unwind, $project
    // =========================================================================
    const popularItems = await Loan.aggregate([
      // Step 1: Group loans by item reference and count occurrences
      {
        $group: {
          _id: '$item',
          loanCount: { $sum: 1 },
        },
      },
      // Step 2: Sort descending by loan count
      { $sort: { loanCount: -1 } },
      // Step 3: Pick the top 6 most popular items
      { $limit: 6 },
      // Step 4: Join with items collection to get item details
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: '$itemDetails' },
      // Step 5: Project title, category, images, and loan count
      {
        $project: {
          _id: '$itemDetails._id',
          title: '$itemDetails.title',
          replacementValue: '$itemDetails.replacementValue',
          averageRating: '$itemDetails.averageRating',
          loanCount: 1,
          images: '$itemDetails.images',
        },
      },
    ]);

    // =========================================================================
    // AGGREGATION PIPELINE 3: Borrowing statistics (Loan status distribution)
    // Demonstrates: $group, $project, $sort
    // =========================================================================
    const borrowingStats = await Loan.aggregate([
      // Step 1: Group all loans by their current status
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      // Step 2: Format the output
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Simple damage reports breakdown by severity
    const damageStats = await DamageReport.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          totalEstimatedCost: { $sum: '$estimatedCost' },
        },
      },
      {
        $project: {
          severity: '$_id',
          count: 1,
          totalEstimatedCost: { $round: ['$totalEstimatedCost', 2] },
        },
      },
    ]);

    return {
      overview: {
        totalUsers,
        totalItems,
        totalLoans,
        activeLoans,
        overdueLoans,
        pendingRequests,
        openDamageReports,
      },
      categoryStats,
      popularItems,
      borrowingStats,
      damageStats,
      monthlyTrends: [],
    };
  }

  /**
   * User Borrowing History:
   * Retrieves all loans where the user was either the borrower or the owner.
   * Uses straightforward Mongoose populate() for easy understanding in college viva.
   */
  static async getUserBorrowingHistory(userId) {
    const loans = await Loan.find({
      $or: [{ borrower: userId }, { owner: userId }],
    })
      .populate('item', 'title images condition replacementValue')
      .populate('borrower', 'name email avatar')
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user reviews to indicate if the user already reviewed the loan
    const loanIds = loans.map((l) => l._id);
    const reviews = await Review.find({
      loan: { $in: loanIds },
      reviewer: userId,
    }).lean();

    const reviewMap = new Map();
    reviews.forEach((r) => reviewMap.set(r.loan.toString(), r));

    // Map each loan to format expected by dashboard UI
    const history = loans.map((loan) => {
      const isBorrower = loan.borrower?._id?.toString() === userId.toString();
      const userReview = reviewMap.get(loan._id.toString()) || null;

      return {
        _id: loan._id,
        role: isBorrower ? 'borrower' : 'owner',
        counterparty: isBorrower ? loan.owner : loan.borrower,
        item: loan.item,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        borrowedAt: loan.borrowedAt,
        returnedAt: loan.returnedAt,
        status: loan.status,
        hasReviewed: !!userReview,
        review: userReview,
        createdAt: loan.createdAt,
      };
    });

    return history;
  }
}

module.exports = AnalyticsService;
