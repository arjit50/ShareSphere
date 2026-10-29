const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Item = require('../models/Item');
const BorrowRequest = require('../models/BorrowRequest');
const Loan = require('../models/Loan');
const Return = require('../models/Return');
const DamageReport = require('../models/DamageReport');
const Review = require('../models/Review');
const { categoriesData, usersData, sampleItemsRaw } = require('./seedData');

const runSeed = async () => {
  try {
    console.log('[Seed Runner] Connecting to database...');
    await connectDB();

    console.log('[Seed Runner] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Item.deleteMany({}),
      BorrowRequest.deleteMany({}),
      Loan.deleteMany({}),
      Return.deleteMany({}),
      DamageReport.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // 1. Seed Categories
    console.log('[Seed Runner] Seeding 11 categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // 2. Seed Users (Single role: 'user')
    console.log('[Seed Runner] Seeding 8 community users...');
    const userDocs = [];
    for (const u of usersData) {
      const user = new User({
        name: u.name,
        email: u.email,
        passwordHash: u.password,
        phone: u.phone,
        avatar: u.avatar,
        address: u.address,
        role: 'user',
        isActive: true,
      });
      await user.save();
      userDocs.push(user);
    }

    const userMap = {};
    userDocs.forEach((u) => {
      userMap[u.email] = u._id;
    });

    // 3. Seed Items
    console.log('[Seed Runner] Seeding 22 realistic items...');
    const itemDocs = [];
    for (const raw of sampleItemsRaw) {
      const ownerId = userMap[raw.ownerEmail];
      const categoryId = categoryMap[raw.categorySlug];

      const item = new Item({
        title: raw.title,
        description: raw.description,
        owner: ownerId,
        category: categoryId,
        condition: raw.condition,
        replacementValue: raw.replacementValue,
        borrowingInstructions: raw.borrowingInstructions,
        location: {
          city: raw.city,
          area: raw.area,
          postalCode: '90210',
        },
        images: [
          {
            url: raw.imageUrl,
            isPrimary: true,
            caption: raw.title,
          },
        ],
        availabilityStatus: 'available',
      });
      await item.save();
      itemDocs.push(item);
    }

    // 4. Create sample Borrow Requests & Loans
    console.log('[Seed Runner] Seeding requests, active loans, overdue loans, returns, and reviews...');
    const now = new Date();

    // Scenario A: Completed Loan with Return & Review (DeWalt Drill borrowed by David from Marcus)
    const dewaltDrill = itemDocs[0];
    const marcus = userDocs.find((u) => u.email === 'marcus@example.com');
    const david = userDocs.find((u) => u.email === 'david@example.com');

    const pastReq1 = await BorrowRequest.create({
      item: dewaltDrill._id,
      requester: david._id,
      owner: marcus._id,
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      message: 'Need this for hanging shelves in my garage over the weekend.',
      status: 'approved',
      respondedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      responseMessage: 'Sure, drill bits are all inside!',
    });

    const pastLoan1 = await Loan.create({
      borrowRequest: pastReq1._id,
      item: dewaltDrill._id,
      borrower: david._id,
      owner: marcus._id,
      startDate: pastReq1.startDate,
      dueDate: pastReq1.endDate,
      borrowedAt: pastReq1.startDate,
      returnedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      status: 'returned',
      returnNotes: 'Returned on time in spotless condition.',
    });

    await Return.create({
      loan: pastLoan1._id,
      returnedBy: david._id,
      item: dewaltDrill._id,
      actualReturnDate: pastLoan1.returnedAt,
      conditionOnReturn: 'same',
      notes: 'Worked like a charm, batteries recharged.',
      lateReturn: false,
      daysLate: 0,
    });

    // Reciprocal reviews
    await Review.create({
      loan: pastLoan1._id,
      reviewer: david._id,
      reviewee: marcus._id,
      item: dewaltDrill._id,
      reviewDirection: 'borrower_to_owner',
      rating: 5,
      comment: 'Top quality drill, Marcus gave great tips and batteries were fully charged.',
    });

    await Review.create({
      loan: pastLoan1._id,
      reviewer: marcus._id,
      reviewee: david._id,
      item: dewaltDrill._id,
      reviewDirection: 'owner_to_borrower',
      rating: 5,
      comment: 'David was super punctual and returned the kit clean. Highly recommended borrower!',
    });

    // Scenario B: Active Loan (Camping tent borrowed by Sarah from Amina)
    const tent = itemDocs[2];
    const amina = userDocs.find((u) => u.email === 'amina@example.com');
    const sarah = userDocs.find((u) => u.email === 'sarah@example.com');

    const activeReq = await BorrowRequest.create({
      item: tent._id,
      requester: sarah._id,
      owner: amina._id,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      message: 'Taking the family camping at Lake Tahoe this week.',
      status: 'approved',
      respondedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      responseMessage: 'Have a wonderful camping trip!',
    });

    const activeLoan = await Loan.create({
      borrowRequest: activeReq._id,
      item: tent._id,
      borrower: sarah._id,
      owner: amina._id,
      startDate: activeReq.startDate,
      dueDate: activeReq.endDate,
      borrowedAt: activeReq.startDate,
      status: 'active',
    });

    tent.availabilityStatus = 'borrowed';
    tent.totalBorrows = 1;
    await tent.save();

    // Scenario C: Overdue Loan (Lawn Mower borrowed by Liam from David)
    const mower = itemDocs[1];
    const liam = userDocs.find((u) => u.email === 'liam@example.com');

    const overdueReq = await BorrowRequest.create({
      item: mower._id,
      requester: liam._id,
      owner: david._id,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      message: 'Yard cleanup after summer storm.',
      status: 'approved',
      respondedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
    });

    const overdueLoan = await Loan.create({
      borrowRequest: overdueReq._id,
      item: mower._id,
      borrower: liam._id,
      owner: david._id,
      startDate: overdueReq.startDate,
      dueDate: overdueReq.endDate,
      borrowedAt: overdueReq.startDate,
      status: 'overdue',
    });

    mower.availabilityStatus = 'borrowed';
    mower.totalBorrows = 1;
    await mower.save();

    // Scenario D: Pending Borrow Requests
    const ladder = itemDocs[4];
    const carlos = userDocs.find((u) => u.email === 'carlos@example.com');
    const priya = userDocs.find((u) => u.email === 'priya@example.com');

    await BorrowRequest.create({
      item: ladder._id,
      requester: priya._id,
      owner: carlos._id,
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      message: 'Need the multi-position ladder to trim tall ivy on our patio trellis.',
      status: 'pending',
    });

    const mixer = itemDocs[3];
    await BorrowRequest.create({
      item: mixer._id,
      requester: marcus._id,
      owner: sarah._id,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      message: 'Baking sourdough bread and pastries for our daughter’s birthday party.',
      status: 'pending',
    });

    // Scenario E: Damage Report on a past loan
    const pressureWasher = itemDocs[5];
    const pastLoanWasher = await Loan.create({
      borrowRequest: new mongoose.Types.ObjectId(),
      item: pressureWasher._id,
      borrower: carlos._id,
      owner: marcus._id,
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      borrowedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: 'returned',
    });

    await DamageReport.create({
      loan: pastLoanWasher._id,
      item: pressureWasher._id,
      reportedBy: marcus._id,
      description: 'The spray nozzle connector plastic ring cracked during high-pressure operation. Minor leak observed.',
      damageType: 'broken',
      severity: 'low',
      estimatedCost: 25,
      status: 'under_review',
    });



    // Recalculate average rating
    await Review.calculateAverageRating(dewaltDrill._id);

    console.log('================================================================');
    console.log(' ShareSphere Database Seed Completed Successfully! ');
    console.log(' Single Role Architecture: All users are equal Community Users.');
    console.log('================================================================');
    console.log(' SEEDED STATISTICS:');
    console.log(` - Categories:     ${createdCategories.length}`);
    console.log(` - Users:          ${userDocs.length} Users`);
    console.log(` - Items:          ${itemDocs.length} Resources`);
    console.log(' - Loans & Req:    Active, Overdue, Completed, and Pending');
    console.log(' - Damage Reports: 1 under review');
    console.log(' - Reviews:        2 reciprocal reviews seeded');
    console.log('----------------------------------------------------------------');
    console.log(' DEMO COMMUNITY USERS (Password: Password@123):');
    console.log('   - Marcus:  marcus@example.com (Owns drill, saw, pressure washer)');
    console.log('   - David:   david@example.com  (Active borrower, lawn mower loan)');
    console.log('   - Amina:   amina@example.com  (Owns tent, stove, satellite unit)');
    console.log('   - Sarah:   sarah@example.com  (Owns mixer, paddleboard, fountain)');
    console.log('   - Carlos:  carlos@example.com (Owns ladder, paint sprayer, game)');
    console.log('================================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Runner Error]:', error);
    process.exit(1);
  }
};

runSeed();
