# ShareSphere — Community Resource Sharing Platform
### 3rd-Year B.Tech CSE College Project for MongoDB / MERN Stack

A clean, full-stack Community Resource Sharing web application built with **React (Vite)**, **Node.js + Express.js**, and **MongoDB with Mongoose**.

ShareSphere allows neighbors in a community to list, discover, borrow, and lend everyday household resources (power tools, gardening equipment, camping gear, kitchen appliances) instead of buying items that are rarely used.

---

## 1. What the Project Does

- **User Registration & Login:** JWT authentication via HTTP-only cookies and bcrypt password hashing.
- **Browse & Search Catalog:** Full-text search and filtering by category, condition, and availability.
- **Item Listings (CRUD):** Members can list items with photos, condition, replacement value, and borrowing instructions. Members can update or delete their own items.
- **Borrow Requests:** Members can submit borrow requests with specific start and end dates.
- **Owner Approval Workflow:** Item owners can review incoming requests and approve or reject them. Approving a request automatically creates a loan and updates item availability.
- **Active Loans & Returns:** Track active loans and due dates. When finished, borrower or owner records the return condition (good, worn, or damaged).
- **Damage Reporting:** If an item is returned damaged, a damage report with severity level and estimated repair cost can be filed.
- **Reviews & Ratings:** After completing a loan, users can rate their experience (1-5 stars) and write feedback.
- **Member Dashboard:** Overview showing listed items, pending requests, active loans, and borrowing timeline.

---

## 2. Technology Stack

- **Frontend:** React + Vite, Tailwind CSS, Axios, Lucide React icons
- **Backend:** Node.js, Express.js, Mongoose, Cookie-Parser, JWT, bcryptjs
- **Database:** MongoDB (Local MongoDB Community Server or MongoDB Atlas cloud)
- **Language:** JavaScript (ES6+)

---

## 3. How to Install and Run

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- MongoDB installed locally OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

### Step 1: Clone or Open the Project
```bash
cd ShareSphere
```

### Step 2: Set Up Backend Environment
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sharesphere
JWT_SECRET=super_secret_jwt_sharesphere_development_key_2026_secured
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
CLIENT_URL=http://localhost:3000
```

### Step 3: Seed Sample Data
Populate the database with sample categories, users, items, and loans:
```bash
npm run seed
```

### Step 4: Start the Backend Server
```bash
npm run dev
```
The backend server runs at `http://localhost:5000`.

### Step 5: Start the Frontend Client
In a new terminal window:
```bash
cd ../frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 4. How to Connect MongoDB Atlas

You can connect directly to MongoDB Atlas without any extra replica set configuration or complex cluster settings.

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster (e.g. AWS / us-east-1).
3. Under **Database Access**, create a database user (e.g., username: `student`, password: `yourpassword123`).
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
5. In your cluster dashboard, click **Connect** -> **Drivers** -> Copy the connection string:
   ```
   mongodb+srv://student:yourpassword123@cluster0.abcde.mongodb.net/sharesphere?retryWrites=true&w=majority
   ```
6. Paste this URI into `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://student:yourpassword123@cluster0.abcde.mongodb.net/sharesphere?retryWrites=true&w=majority
   ```
7. Start your server with `npm run dev`. Mongoose connects seamlessly!

---

## 5. Database Collections

The application uses **9 collections**, each stored in its own Mongoose model:

| Collection | Model File | Description |
| :--- | :--- | :--- |
| **`users`** | `User.js` | Member profiles, email (unique), hashed password, contact info |
| **`items`** | `Item.js` | Resources listed for sharing (tools, tents, mixers), category, owner reference |
| **`categories`** | `Category.js` | Resource groupings (Power Tools, Gardening, Camping, Party Gear) |
| **`borrow_requests`** | `BorrowRequest.js` | Requests with date range, requester, owner, and status (pending/approved/rejected) |
| **`loans`** | `Loan.js` | Active or completed loan contracts linking borrower, owner, item, and dates |
| **`returns`** | `Return.js` | Return log recording return date, condition, and late days |
| **`damage_reports`** | `DamageReport.js` | Claims for damaged items with severity and estimated cost |
| **`reviews`** | `Review.js` | Star rating (1-5) and feedback submitted after a loan completes |

---

## 6. How Collections Are Connected (ObjectId References)

Rather than embedding entire large documents inside each other (which can cause documents to exceed MongoDB's 16MB document limit and leads to duplicate data), we use **Normalized Referencing with `mongoose.Schema.Types.ObjectId`**:

```javascript
// Example from models/Loan.js
const loanSchema = new mongoose.Schema({
  borrowRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRequest',
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, default: 'approved' },
});
```

### Why use references?
1. **Data Consistency:** When a user updates their name or email, you update it once in the `users` collection, and all loans automatically point to the updated information.
2. **Document Size Limits:** Avoids unbounded arrays growing inside a single document.
3. **Clean Relationships:** Clear 1-to-many relationship between users, items, and loan transactions.

---

## 7. What `populate()` Does (With Example)

In MongoDB, referencing stores only the 24-character hexadecimal `_id` of the related document.
**`populate()`** is a Mongoose feature that automatically replaces the stored `ObjectId` with the actual document from the referenced collection (similar to an SQL `JOIN`).

### Simple Example:
```javascript
// Without populate():
const loan = await Loan.findById("65f1a2b3c4d5e6f7a8b9c0d1");
console.log(loan);
// Output:
// {
//   _id: "65f1a2b3c4d5e6f7a8b9c0d1",
//   item: "65f1a2b3c4d5e6f7a8b9c099",    <-- Only an ObjectId
//   borrower: "65f1a2b3c4d5e6f7a8b9c011",<-- Only an ObjectId
//   status: "approved"
// }

// With populate():
const loan = await Loan.findById("65f1a2b3c4d5e6f7a8b9c0d1")
  .populate('item', 'title replacementValue')
  .populate('borrower', 'name email');

console.log(loan);
// Output:
// {
//   _id: "65f1a2b3c4d5e6f7a8b9c0d1",
//   item: {
//     _id: "65f1a2b3c4d5e6f7a8b9c099",
//     title: "DeWalt 20V Cordless Drill",
//     replacementValue: 180
//   },
//   borrower: {
//     _id: "65f1a2b3c4d5e6f7a8b9c011",
//     name: "David Kim",
//     email: "david@example.com"
//   },
//   status: "approved"
// }
```

---

## 8. Basic CRUD Operations in the Project

### Create (Insert)
```javascript
// Adding a new item (Item.create)
const newItem = await Item.create({
  title: "Bosch Rotary Hammer Drill",
  description: "Heavy duty hammer drill for concrete and masonry work.",
  owner: req.user._id,
  category: categoryId,
  condition: "like-new",
  replacementValue: 220,
  availabilityStatus: "available"
});
```

### Read (Find / Query)
```javascript
// Finding all available items with text search and category filter
const items = await Item.find({
  availabilityStatus: "available",
  category: categoryId,
  isDeleted: false
})
  .populate('owner', 'name avatar')
  .populate('category', 'name icon')
  .sort({ createdAt: -1 });
```

### Update
```javascript
// Updating an item's status when borrowed
await Item.findByIdAndUpdate(
  itemId,
  { $set: { availabilityStatus: "borrowed" } },
  { new: true }
);
```

### Delete (Soft Delete)
```javascript
// Soft deleting an item to preserve loan and review history
const item = await Item.findById(itemId);
item.isDeleted = true;
item.availabilityStatus = "retired";
await item.save();
```

---

## 9. Three Simple Aggregation Pipelines Explained

In MongoDB, aggregation pipelines process documents in multi-stage transformations:

### Pipeline 1: Category-Wise Item Counts
**Location:** `backend/src/services/analyticsService.js`  
**Purpose:** Groups all items by their category reference and counts how many items are currently in each category.

```javascript
const categoryStats = await Item.aggregate([
  // Stage 1: Filter out soft-deleted items
  { $match: { isDeleted: false } },

  // Stage 2: Group by category and calculate counts
  {
    $group: {
      _id: '$category',
      totalItems: { $sum: 1 },
      availableItems: {
        $sum: { $cond: [{ $eq: ['$availabilityStatus', 'available'] }, 1, 0] }
      }
    }
  },

  // Stage 3: Lookup category details (name, icon) from categories collection
  {
    $lookup: {
      from: 'categories',
      localField: '_id',
      foreignField: '_id',
      as: 'categoryDetails'
    }
  },

  // Stage 4: Flatten the categoryDetails array
  { $unwind: '$categoryDetails' },

  // Stage 5: Select and format the final output fields
  {
    $project: {
      _id: 1,
      name: '$categoryDetails.name',
      icon: '$categoryDetails.icon',
      totalItems: 1,
      availableItems: 1
    }
  },

  // Stage 6: Sort by most items first
  { $sort: { totalItems: -1 } }
]);
```

### Pipeline 2: Most Borrowed (Popular) Items
**Location:** `backend/src/services/analyticsService.js`  
**Purpose:** Analyzes the `loans` collection to find which resources are borrowed the most.

```javascript
const popularItems = await Loan.aggregate([
  // Stage 1: Group loans by item ID and count how many times each item was borrowed
  {
    $group: {
      _id: '$item',
      loanCount: { $sum: 1 }
    }
  },

  // Stage 2: Sort descending by loan count
  { $sort: { loanCount: -1 } },

  // Stage 3: Limit to top 6 items
  { $limit: 6 },

  // Stage 4: Join with items collection to get the title and pictures
  {
    $lookup: {
      from: 'items',
      localField: '_id',
      foreignField: '_id',
      as: 'itemDetails'
    }
  },
  { $unwind: '$itemDetails' },

  // Stage 5: Project only the fields needed by the frontend card
  {
    $project: {
      _id: '$itemDetails._id',
      title: '$itemDetails.title',
      loanCount: 1,
      images: '$itemDetails.images'
    }
  }
]);
```

### Pipeline 3: Borrowing Statistics (Status Breakdown)
**Location:** `backend/src/services/analyticsService.js`  
**Purpose:** Groups loans by their status (`approved`, `active`, `returned`, `overdue`) to show platform activity.

```javascript
const borrowingStats = await Loan.aggregate([
  // Stage 1: Group all loan documents by their status field
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  },

  // Stage 2: Project clean output object
  {
    $project: {
      _id: 0,
      status: '$_id',
      count: 1
    }
  },

  // Stage 3: Sort by highest count
  { $sort: { count: -1 } }
]);
```

---

## 10. How to Demonstrate in a College Viva

### Demo Accounts (Pre-seeded)
All test accounts use the password: `Password@123`

| User Name | Email | Role / Test Purpose |
| :--- | :--- | :--- |
| **Marcus Brody** | `marcus@example.com` | **Resource Owner:** Owns DeWalt Drill, Circular Saw, Pressure Washer |
| **David Kim** | `david@example.com` | **Borrower:** Has active loans, can request items and record returns |
| **Amina Patel** | `amina@example.com` | **Member:** Owns camping gear |
| **Sarah Chen** | `sarah@example.com` | **Member:** Owns kitchen and paddleboard gear |

*(Note: The login page has 1-click Quick Login buttons for quick viva demonstration!)*

### Recommended 5-Minute Viva Flow:
1. **Show Browse Page:**
   - Search for `drill`. Show how MongoDB `$text` search filters items matching the keyword.
   - Filter by category (**Power Tools**) or condition (**Like New**).
2. **Submit a Borrow Request:**
   - Log in as **David Kim** (`david@example.com`).
   - Pick an item owned by Marcus (e.g. *DeWalt Drill* or *Makita Circular Saw*).
   - Click **Request to Borrow**, pick start and end dates, and click submit.
3. **Approve Request as Owner:**
   - Log out and log in as **Marcus Brody** (`marcus@example.com`).
   - Open **Incoming Requests**.
   - Show the pending request from David and click **Approve Request**.
   - Explain what happened in MongoDB:
     - `BorrowRequest` status updated to `approved`.
     - New document inserted into `loans` collection.
     - `Item` status updated to `reserved`.
4. **Complete Loan & Record Return:**
   - In **My Loans**, confirm item pickup (`active`).
   - Click **Record Return**, select condition (*Good / Same*), and click submit.
   - Show that item availability status returns to `available`.
5. **Explain MongoDB Questions:**
   - Open `backend/src/models/Loan.js` and show the `ObjectId` references.
   - Open `backend/src/services/analyticsService.js` and explain the 3 aggregation pipelines.

---

## 11. Common Viva Questions & Answers

**Q1: Why did you choose MongoDB instead of MySQL/PostgreSQL?**
> **A:** MongoDB stores documents as flexible BSON JSON-like structures. It allows intuitive modeling of entities where items have embedded subdocuments (like image galleries and location data) while using ObjectId references for relationships (like loans and users).

**Q2: What is the difference between referencing and embedding?**
> **A:** 
> - **Embedding:** Storing a child object directly inside the parent document (used for `location` and `images` because they are small, bounded, and always retrieved with the item).
> - **Referencing:** Storing only the `_id` of the related document (used for `borrower`, `owner`, `item` in `loans` to prevent data duplication and unbound growth).

**Q3: What is the purpose of Mongoose?**
> **A:** Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides schema validation, type casting, default values, middleware hooks, and helper methods like `.populate()`.

**Q4: How do you prevent a user from borrowing their own item?**
> **A:** In `backend/src/services/borrowService.js`, before creating a borrow request, we compare `item.owner.toString() === requesterId.toString()`. If they match, the backend throws an error: `"You cannot borrow your own item"`.

**Q5: Can this project run on MongoDB Atlas without replica sets?**
> **A:** Yes. We use straightforward Mongoose connection (`mongoose.connect(MONGODB_URI)`) and standard sequential CRUD operations without requiring a multi-document replica set transaction. It works directly on standard free-tier MongoDB Atlas clusters.
