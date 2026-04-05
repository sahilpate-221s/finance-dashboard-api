# Finance Dashboard API

## Overview

The Finance Dashboard API is a production-ready RESTful backend service built to power personal and organizational finance tracking applications. 

## Key Features
- **Transaction Management:** Record, categorize, and filter income and expenses.
- **Role-Based Access Control:** Strict boundaries between Viewers (read-only), Analysts (manage own data), and Admins (platform oversight).
- **Advanced Analytics:** Monthly trends, per-category breakdowns, and financial summaries computed efficiently via MongoDB aggregation pipelines instead of JavaScript arrays.

---

## Tech Stack

| Technology          | Purpose                                                             |
|---------------------|---------------------------------------------------------------------|
| **Node.js**         | JavaScript runtime environment for the server                       |
| **Express.js**      | Web framework for routing, middleware composition, and HTTP handling |
| **MongoDB**         | NoSQL document database for storing users and transactions          |
| **Mongoose**        | ODM layer providing schema validation, hooks, and query abstractions |
| **JWT**             | Stateless authentication via signed access tokens                   |
| **bcryptjs**        | Secure one-way password hashing with salt rounds                    |
| **express-validator** | Request body validation and sanitization at the route level       |
| **express-rate-limit** | IP-based rate limiting to prevent brute-force and API abuse      |

---

## Project Structure

```
finance-dashboard-api/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection logic using Mongoose
│   ├── models/
│   │   ├── User.js                # User schema with password hashing and JWT generation
│   │   └── Transaction.js         # Transaction schema with soft delete and compound index
│   ├── middleware/
│   │   ├── auth.js                # JWT verification and req.user injection
│   │   ├── roleGuard.js           # Role-based access control factory middleware
│   │   ├── errorHandler.js        # Global Express error handler for all thrown errors
│   │   └── rateLimiter.js         # IP rate limiters: strict for auth, general for all routes
│   ├── routes/
│   │   ├── auth.routes.js         # Public and protected authentication endpoints
│   │   ├── user.routes.js         # Admin-only user management endpoints
│   │   ├── transaction.routes.js  # Transaction CRUD endpoints with role filtering
│   │   └── dashboard.routes.js    # Aggregated insight endpoints for the dashboard
│   ├── controllers/
│   │   ├── auth.controller.js     # Handles HTTP layer for auth operations
│   │   ├── user.controller.js     # Handles HTTP layer for user management
│   │   ├── transaction.controller.js # Handles HTTP layer for transaction CRUD
│   │   └── dashboard.controller.js   # Handles HTTP layer for dashboard analytics
│   ├── services/
│   │   ├── auth.service.js        # Business logic for registration and login
│   │   ├── user.service.js        # Business logic for user queries and mutations
│   │   ├── transaction.service.js # Business logic for transaction operations and ownership checks
│   │   └── dashboard.service.js   # MongoDB aggregation pipelines for analytics
│   ├── validators/
│   │   ├── auth.validator.js      # Input rules for register and login requests
│   │   └── transaction.validator.js # Input rules for create and update transaction requests
│   ├── utils/
│   │   ├── ApiError.js            # Custom Error class with statusCode and errors array
│   │   ├── ApiResponse.js         # Standardized success response wrapper
│   │   └── asyncHandler.js        # Higher-order function to catch async errors automatically
│   └── app.js                     # Express app setup, middleware registration, and route mounting
├── .env                           # Local environment variables (never commit this)
├── .env.example                   # Template showing required environment variables
├── .gitignore                     # Files and folders excluded from version control
└── package.json                   # Project metadata, scripts, and dependency declarations
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally or a MongoDB Atlas connection string

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/finance-dashboard-api.git
cd finance-dashboard-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in your values

# 4. Start the development server
npm run dev
```

The server will start on `http://localhost:5000` by default.

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable      | Description                                         | Example                                         |
|---------------|-----------------------------------------------------|-------------------------------------------------|
| `PORT`        | Port the Express server listens on                  | `5000`                                          |
| `MONGO_URI`   | MongoDB connection string                           | `mongodb://localhost:27017/finance_dashboard`   |
| `JWT_SECRET`  | Secret key used to sign and verify JWT tokens       | `your_strong_jwt_secret_key_here`               |
| `JWT_EXPIRE`  | JWT token expiry duration                           | `7d`                                            |

---

## Roles and Permissions

The system implements three roles with progressively increasing access levels:

| Action                         | Viewer | Analyst | Admin |
|--------------------------------|:------:|:-------:|:-----:|
| View own transactions          | ✅     | ✅      | ✅    |
| Create transaction             | ❌     | ✅      | ✅    |
| Update own transaction         | ❌     | ✅      | ✅    |
| Delete own transaction         | ❌     | ✅      | ✅    |
| View all transactions          | ❌     | ❌      | ✅    |
| Update any transaction         | ❌     | ❌      | ✅    |
| Delete any transaction         | ❌     | ❌      | ✅    |
| Manage users (CRUD)            | ❌     | ❌      | ✅    |
| View dashboard summary         | ✅     | ✅      | ✅    |
| Access category breakdown      | ✅     | ✅      | ✅    |
| View monthly trends            | ✅     | ✅      | ✅    |
| View recent activity           | ✅     | ✅      | ✅    |

---

## API Documentation

A complete API reference and system design document 
is available in the file:

📄 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

This file covers:
- Full system architecture diagram
- Folder structure and responsibilities
- Role and permission matrix
- Database schema for all collections
- JWT authentication flow step by step
- Error handling and soft delete strategy
- Rate limiting configuration
- Complete API reference for all 18+ endpoints
  with request bodies, response shapes, 
  and error codes
- HTTP status code reference

You can also test all endpoints using the Postman 
collection included in the repository:
📦 `postman_collection.json`
Import it via Postman → File → Import → select file.

---

## API Reference

### Auth — `/api/v1/auth`

| Method | Endpoint            | Auth Required | Description                                  |
|--------|---------------------|:-------------:|----------------------------------------------|
| POST   | `/register`         | ❌            | Create a new user account                    |
| POST   | `/login`            | ❌            | Authenticate and receive a JWT token         |
| GET    | `/me`               | ✅ Any role   | Fetch the currently authenticated user       |

### Users — `/api/v1/users`

| Method | Endpoint            | Role          | Description                                  |
|--------|---------------------|:-------------:|----------------------------------------------|
| GET    | `/`                 | Admin         | List all users with pagination and filters   |
| GET    | `/:id`              | Admin         | Fetch a single user by ID                   |
| PATCH  | `/:id/role`         | Admin         | Change a user's role                         |
| PATCH  | `/:id/status`       | Admin         | Toggle a user's active/inactive status       |
| DELETE | `/:id`              | Admin         | Permanently delete a user account            |

### Transactions — `/api/v1/transactions`

| Method | Endpoint            | Role              | Description                                       |
|--------|---------------------|:-----------------:|---------------------------------------------------|
| POST   | `/`                 | Admin, Analyst    | Create a new transaction                          |
| GET    | `/`                 | All roles         | List transactions (admins see all, others own)    |
| GET    | `/:id`              | All roles         | Fetch a single transaction (ownership enforced)   |
| PUT    | `/:id`              | Admin, Analyst    | Update allowed fields of a transaction            |
| DELETE | `/:id`              | Admin, Analyst    | Soft-delete a transaction                         |

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint            | Role          | Description                                        |
|--------|---------------------|:-------------:|----------------------------------------------------|
| GET    | `/summary`          | All roles     | Total income, expenses, net balance, count         |
| GET    | `/categories`       | All roles     | Transaction totals grouped by category and type    |
| GET    | `/trends?year=2024` | All roles     | Monthly income and expense trends for a given year |
| GET    | `/recent?limit=5`   | All roles     | Most recent N transactions with user info          |

---

## Assumptions Made

1. **Stateless Auth:** A single JWT token without a refresh strategy is sufficient for a simplified dashboard assignment.
2. **Fixed Ownership:** Transaction ownership (`createdBy`) is set once at creation and cannot be transferred, even by admins.
3. **Selective Deletion:** Transactions are soft-deleted to preserve history, but users are hard-deleted to prevent orphaned record issues.
4. **Single Currency:** All amounts are raw numbers; no multi-currency conversion layer is required.
5. **Back-dated Entries:** The transaction `date` represents the actual financial date occurring in the real world, not the timestamp of when the record was created.

---

## Design Decisions

### 1. Soft Delete Over Hard Delete
- **Why:** Preserves financial history and audit trails.
- **How:** Uses an `isDeleted: true` flag. A Mongoose `pre('find')` hook automatically hides deleted records from regular queries, while keeping them recoverable by admins.

### 2. Aggregation Pipelines Over JS Arrays
- **Why:** In-memory array `.reduce()` degrades as datasets grow.
- **How:** Complex analytics (monthly trends, category breakdowns) run directly on the database engine using MongoDB Aggregation Pipelines, returning only the final optimized result.

### 3. Role Guard as a Factory Middleware
- **Why:** Makes route definitions self-documenting (e.g., `authorize("admin", "analyst")`).
- **How:** A higher-order function checks `req.user.role` before allowing access, making it trivial to add or update permissions.

### 4. Centralized Error Handling
- **Why:** Prevents scattered `res.status(400)` blocks and unhandled promise rejections.
- **How:** Services throw an `ApiError`. A global Express `errorHandler` catches everything—including MongoDB native errors—and normalizes them into one consistent JSON format.

### 5. Tiered Rate Limiting
- **Why:** Protects against both brute-force attacks and general API scraping.
- **How:** `authLimiter` strictly throttles login/registration (10 req / 15m), while `generalLimiter` protects all other endpoints (100 req / 15m).
