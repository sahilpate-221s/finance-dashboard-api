# Finance Dashboard API

## Overview

The Finance Dashboard API is a production-ready RESTful backend service built to power personal and organizational finance tracking applications. It allows users to record, categorize, and analyze financial transactions — both income and expenses — through a clean, structured API. The system enforces a role-based access model so that different users (viewers, analysts, and administrators) interact with the platform within clearly defined boundaries. Beyond simple CRUD operations, the API provides aggregated insights such as monthly income/expense trends, per-category breakdowns, and real-time financial summaries — all computed directly on the database using MongoDB aggregation pipelines for efficiency and accuracy at scale.

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

1. **A single JWT token is sufficient for session management.** The API does not implement refresh tokens or token blacklisting on logout. Once issued, a token remains valid until its expiry. This keeps the implementation stateless and straightforward for a finance dashboard context where sessions are not expected to last days.

2. **Transaction ownership is determined at creation time and cannot be transferred.** The `createdBy` field is set once during creation from `req.user._id` and is never exposed as an updatable field, even to admins. Ownership reassignment is not a business requirement for this system.

3. **Soft deletion is only available for transactions, not for users.** User accounts are permanently deleted because orphaned user records with foreign-key references (e.g., transactions) are more problematic than simply removing the user. Transactions are soft-deleted to preserve financial history.

4. **All monetary amounts are stored and returned as raw numbers without currency conversion.** The API assumes all transactions are recorded in a single unified currency. Multi-currency support would require an additional `currency` field and a conversion layer.

5. **The `date` field on a transaction represents the actual financial date, not the creation timestamp.** This allows users to back-date transactions (e.g., entering last month's grocery bill today), which is a common real-world requirement for personal finance tools.

---

## Design Decisions

### Soft Delete Over Hard Delete for Transactions
Financial records carry historical significance — deleting a transaction permanently would break audit trails, skew past summaries, and make recovery impossible. By using an `isDeleted: true` flag and a Mongoose pre-find middleware that automatically excludes deleted records from queries, the system achieves deletion from the user's perspective while preserving data integrity underneath. The pre-find hook is smart enough to step aside when `isDeleted` is explicitly passed in a query, making admin-level recovery queries possible without any special workarounds.

### MongoDB Aggregation Pipelines Over JavaScript-Level Computation
Dashboard analytics — summaries, category breakdowns, and monthly trends — could theoretically be computed by fetching all transactions into Node.js and reducing them in memory. However, this approach would degrade badly as the dataset grows. Instead, all analytical logic lives inside MongoDB aggregation pipelines that execute directly on the database engine, transferring only the final computed result over the network. The monthly trends pipeline, for example, groups, pivots, and sorts entirely in the database before returning a 12-element array to the server.

### Role Guard as a Factory Middleware
The `authorize` function in `roleGuard.js` is designed as a higher-order function that accepts a variable number of allowed roles and returns a middleware. This pattern makes route definitions self-documenting: `authorize("admin", "analyst")` reads like a permission declaration at a glance, and adding a new role to an existing route requires changing a single string. The middleware is always chained after `protect`, which guarantees `req.user` is populated before the role is checked.

### Centralized Error Handling via ApiError
Rather than writing `res.status(400).json(...)` blocks scattered across controllers and services, all errors are expressed by throwing an `ApiError` instance anywhere in the call stack. The global `errorHandler` middleware in Express catches every thrown error — including native Mongoose errors — and normalizes them into a consistent `{ success, statusCode, message, errors }` shape. This means the API always speaks the same language to its consumers, regardless of whether the error originated in a validator, a service, or an unexpected database failure.

### Rate Limiting Strategy
The API uses two-tiered IP-based rate limiting via `express-rate-limit`. A strict `authLimiter` (10 requests per 15 minutes) is applied directly to `POST /auth/login` and `POST /auth/register` — the endpoints most vulnerable to brute-force and credential stuffing attacks. A broader `generalLimiter` (100 requests per 15 minutes) is applied globally to all `/api/v1/*` routes to prevent excessive scraping or API abuse. When a limit is exceeded, the API returns a `429 Too Many Requests` response with the same standardized error shape used across the entire project. Rate limit metadata (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) is automatically included in response headers.
