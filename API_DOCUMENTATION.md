# API Documentation — Finance Dashboard API

---

## Section 1: System Design

---

### 1.1 System Overview

The Finance Dashboard API is a multi-role backend service built for tracking personal and organizational finances. It enables users to log income and expense transactions, categorize them, and derive meaningful insights through aggregated analytics. The system serves three distinct user types: **viewers** who monitor their financial data read-only, **analysts** who actively record and manage transactions, and **administrators** who oversee the entire platform including user management and unrestricted data access. The core problem it solves is providing a structured, secure, and role-aware financial data layer that a frontend application or mobile client can consume without needing to implement any business logic of its own.

---

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────┐
│     Client (Postman / Frontend)     │
│  Sends HTTP requests with JWT token │
└──────────────────┬──────────────────┘
                   │ HTTP Request
                   ▼
┌─────────────────────────────────────┐
│         Express Server              │
│            (app.js)                 │
│  cors · json · urlencoded · dotenv  │
│     generalLimiter (all routes)     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           Route Layer               │
│  /auth  /users  /transactions       │
│           /dashboard                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Middleware Layer            │
│  authLimiter (login/register only)  │
│  protect → authorize → validate     │
│  (JWT verify → role check →         │
│   input validation)                 │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Controller Layer            │
│  Reads req, calls service,          │
│  returns ApiResponse                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Service Layer              │
│  Business logic, ownership checks,  │
│  throws ApiError on failure         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Model Layer                │
│  Mongoose schemas, hooks,           │
│  instance methods, indexes          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         MongoDB Database            │
│    Collections: users,              │
│    transactions                     │
└─────────────────────────────────────┘
```

> All unhandled errors bubble up to the global `errorHandler` middleware registered at the bottom of `app.js`, which normalizes every error into a consistent JSON response.

---

### 1.3 Folder Responsibility Table

| Folder / File       | Responsibility                                                                 |
|---------------------|--------------------------------------------------------------------------------|
| `config/`           | MongoDB connection logic; establishes and exports the Mongoose connection       |
| `models/`           | Mongoose schema definitions, field validation rules, pre-save hooks, and instance methods |
| `middleware/`       | JWT authentication (`protect`), role-based authorization (`authorize`), global error normalization (`errorHandler`), and IP rate limiting (`rateLimiter`) |
| `routes/`           | URL path definitions and middleware chain composition for each resource group   |
| `controllers/`      | HTTP request/response handling; reads from `req`, delegates to service, writes `ApiResponse` |
| `services/`         | All business logic, ownership enforcement, database queries, and aggregation pipelines |
| `validators/`       | `express-validator` rule arrays for request body sanitization and validation   |
| `utils/`            | Reusable primitives: `ApiError` (custom error class), `ApiResponse` (response wrapper), `asyncHandler` (async error catcher) |

---

### 1.4 Role and Permission Matrix

| Permission                        | Viewer | Analyst | Admin |
|-----------------------------------|:------:|:-------:|:-----:|
| Register / Login                  |  ✅   |   ✅   |  ✅   |
| View own profile                  |  ✅   |   ✅   |  ✅   |
| View own transactions             |  ✅   |   ✅   |  ✅   |
| Create transaction                |  ❌   |   ✅   |  ✅   |
| Update own transaction            |  ❌   |   ✅   |  ✅   |
| Delete own transaction            |  ❌   |   ✅   |  ✅   |
| View all transactions (any user)  |  ❌   |   ❌   |  ✅   |
| Edit any transaction              |  ❌   |   ❌   |  ✅   |
| Delete any transaction            |  ❌   |   ❌   |  ✅   |
| View dashboard summary            |  ✅   |   ✅   |  ✅   |
| View category breakdown           |  ✅   |   ✅   |  ✅   |
| View monthly trends               |  ✅   |   ✅   |  ✅   |
| View recent activity              |  ✅   |   ✅   |  ✅   |
| View all users                    |  ❌   |   ❌   |  ✅   |
| Update user role                  |  ❌   |   ❌   |  ✅   |
| Activate / Deactivate user        |  ❌   |   ❌   |  ✅   |
| Delete user                       |  ❌   |   ❌   |  ✅   |

---

### 1.5 Database Schema Design

#### Users Collection

| Field       | Type     | Constraints                                              |
|-------------|----------|----------------------------------------------------------|
| `_id`       | ObjectId | Auto-generated by MongoDB                                |
| `name`      | String   | Required · Trimmed · Min 2 chars · Max 50 chars          |
| `email`     | String   | Required · Unique · Lowercase · Trimmed · Valid format   |
| `password`  | String   | Required · Min 6 chars · Bcrypt hashed · Excluded from queries by default |
| `role`      | String   | Enum: `viewer`, `analyst`, `admin` · Default: `viewer`   |
| `isActive`  | Boolean  | Default: `true` · Deactivated users cannot authenticate  |
| `createdAt` | Date     | Auto-managed by Mongoose `timestamps: true`              |
| `updatedAt` | Date     | Auto-managed by Mongoose `timestamps: true`              |

#### Transactions Collection

| Field         | Type     | Constraints                                            |
|---------------|----------|--------------------------------------------------------|
| `_id`         | ObjectId | Auto-generated by MongoDB                              |
| `createdBy`   | ObjectId | Required · Reference to `User` collection              |
| `amount`      | Number   | Required · Min value: `0.01`                           |
| `type`        | String   | Required · Enum: `income`, `expense`                   |
| `category`    | String   | Required · Enum of 12 valid categories                 |
| `date`        | Date     | Required · Default: `Date.now`                         |
| `description` | String   | Optional · Trimmed · Max 500 chars · Default: `""`     |
| `isDeleted`   | Boolean  | Default: `false` · Hidden from all query results       |
| `createdAt`   | Date     | Auto-managed by Mongoose `timestamps: true`            |
| `updatedAt`   | Date     | Auto-managed by Mongoose `timestamps: true`            |

> **Compound Index** on `{ createdBy, type, category, date }` is defined for optimized query performance on filtered transaction listings.

> **Valid Categories:** `Salary`, `Freelance`, `Investment`, `Business`, `Food`, `Rent`, `Utilities`, `Transport`, `Healthcare`, `Education`, `Entertainment`, `Other`

---

### 1.6 Authentication Flow

```
Step 1 ─ Client sends:
          POST /api/v1/auth/login
          { "email": "...", "password": "..." }

Step 2 ─ Server looks up user by email with password field selected.
          Compares submitted password against bcrypt hash.

Step 3 ─ If credentials are valid and account is active,
          server signs a JWT:
          payload = { id: user._id, role: user.role }
          signed with JWT_SECRET, expires in JWT_EXPIRE.

Step 4 ─ Server returns the token to the client.
          Client stores it (memory, localStorage, etc.)
          and attaches it to every subsequent request:
          Authorization: Bearer <token>

Step 5 ─ protect middleware intercepts the request,
          extracts the token from the Authorization header,
          verifies it using jwt.verify(),
          fetches the user from DB and attaches to req.user.

Step 6 ─ authorize middleware reads req.user.role
          and compares it against the allowed roles
          defined on the route.

Step 7 ─ If role matches → request proceeds to controller.
          If role does not match → 403 Forbidden is returned.
```

---

### 1.7 Error Handling Strategy

All errors in the application are handled through a single centralized `errorHandler` middleware registered as the last middleware in `app.js`. The flow works as follows:

- Every async route handler is wrapped by `asyncHandler`, which catches any thrown error and forwards it to Express via `next(error)` without requiring try/catch blocks.
- Business logic in services throws `new ApiError(statusCode, message, errorsArray)` when validation or authorization fails.
- The global `errorHandler` intercepts all errors and handles three specific Mongoose error types:
  - `CastError` (invalid ObjectId) → normalized to `400 "Resource not found"`
  - Duplicate key error (code `11000`) → normalized to `409 "Duplicate field value: <field>"`
  - `ValidationError` → normalized to `400` with all Mongoose messages collected into the errors array
- All error responses — regardless of origin — follow the same consistent shape:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human readable error message",
  "errors": [
    { "field": "email", "message": "Please provide a valid email" }
  ]
}
```

---

### 1.8 Soft Delete Strategy

Transactions in this system are never permanently removed from the database. When a delete request is received, the service locates the transaction and sets `isDeleted: true`, then saves the document. The record continues to exist in MongoDB but becomes invisible to all standard queries.

This is enforced by a **Mongoose pre-find middleware** defined on the `transactionSchema` that automatically appends `{ isDeleted: false }` to every find-type query before it executes. The middleware is smart enough to skip injecting this condition when `isDeleted` is already explicitly present in the query filter, preserving the ability to query or restore deleted records at the admin level if needed in the future.

The benefits of this approach are:
- **Audit integrity** — financial history is preserved even after deletion
- **Data recovery** — deleted records can be restored without any data loss
- **Transparent to consumers** — API clients never see deleted records without any extra filtering logic on their end

---

### 1.9 Rate Limiting Strategy

The API implements two-tiered IP-based rate limiting using `express-rate-limit` to protect against brute-force attacks and excessive API usage.

| Limiter | Applied To | Max Requests | Window |
|---------|------------|:------------:|--------|
| `authLimiter` | `POST /auth/login`, `POST /auth/register` | 10 | 15 minutes |
| `generalLimiter` | All `/api/v1/*` routes | 100 | 15 minutes |

**Why two separate limiters?**
- Auth routes are the primary target for credential stuffing and brute-force attacks, so they require a tight threshold.
- General routes need enough headroom for legitimate use (dashboards polling, paginated listings, etc.) while still preventing scraping or abuse.

**When a rate limit is exceeded, the response is:**

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many attempts from this IP. Please try again after 15 minutes.",
  "errors": []
}
```

**Response headers automatically included on every request:**

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed in the window |
| `RateLimit-Remaining` | Requests remaining in the current window |
| `RateLimit-Reset` | Timestamp when the window resets |

---

---

## Section 2: Complete API Reference

```
Base URL (Local):       http://localhost:5000/api/v1
Base URL (Live):        https://finance-dashboard-api-1vyf.onrender.com/api/v1
Authentication:         Authorization: Bearer <token>
Content-Type:   application/json (for all POST/PUT/PATCH requests)
```

---

### 2.1 Auth Endpoints

---

#### `POST /auth/register`

Register a new user account.

| Property | Value |
|----------|-------|
| **Access** | Public |
| **Auth Required** | ❌ No |

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123",
  "role": "analyst"
}
```

| Field | Type | Required | Rules |
|-------|------|:--------:|-------|
| `name` | String | ✅ | Min 2, Max 50 chars |
| `email` | String | ✅ | Valid email format |
| `password` | String | ✅ | Min 6 chars, at least one letter and one number |
| `role` | String | ❌ | `viewer`, `analyst`, or `admin`. Defaults to `viewer` |

**Success Response `201`:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "analyst",
      "isActive": true
    }
  }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Validation failed (missing fields, invalid email, weak password) |
| `409` | An account with this email already exists |
| `429` | Too many registration attempts from this IP |

---

#### `POST /auth/login`

Authenticate a user and receive a JWT token.

| Property | Value |
|----------|-------|
| **Access** | Public |
| **Auth Required** | ❌ No |

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "pass123"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "analyst",
      "isActive": true
    }
  }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Validation failed |
| `401` | Invalid email or password |
| `403` | Account has been deactivated |
| `429` | Too many login attempts from this IP |

---

#### `GET /auth/me`

Retrieve the profile of the currently authenticated user.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Any role |

**Request Body:** None

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst",
    "isActive": true,
    "createdAt": "2024-04-01T00:00:00.000Z",
    "updatedAt": "2024-04-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `401` | No token provided or invalid token |
| `403` | Account deactivated |

---

### 2.2 User Endpoints

> All user routes require **Admin** role.

---

#### `GET /users`

Retrieve a paginated list of all users with optional filters.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin only |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | Number | `1` | Page number |
| `limit` | Number | `10` | Results per page |
| `role` | String | — | Filter by role: `viewer`, `analyst`, `admin` |
| `isActive` | Boolean | — | Filter by status: `true` or `false` |

**Example:** `GET /users?page=1&limit=10&role=analyst&isActive=true`

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successfully",
  "data": {
    "users": [
      {
        "_id": "64abc...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "analyst",
        "isActive": true,
        "createdAt": "2024-04-01T00:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

---

#### `GET /users/:id`

Retrieve a single user by their MongoDB ObjectId.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin only |

**Success Response `200`:** User object

**Error Responses:**

| Code | Reason |
|------|--------|
| `404` | User not found |
| `400` | Invalid ObjectId format |

---

#### `PATCH /users/:id/role`

Update the role assigned to a user.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin only |

**Request Body:**

```json
{
  "role": "analyst"
}
```

> Valid values: `"viewer"`, `"analyst"`, `"admin"`

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role updated successfully",
  "data": { "updated user object" }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Admin cannot change their own role |
| `404` | User not found |

---

#### `PATCH /users/:id/status`

Toggle the active/inactive status of a user account.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin only |

**Request Body:** None (status is toggled automatically)

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User status updated successfully",
  "data": { "_id": "...", "isActive": false }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Admin cannot deactivate their own account |
| `404` | User not found |

---

#### `DELETE /users/:id`

Permanently delete a user account from the system.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin only |

**Request Body:** None

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User removed successfully",
  "data": null
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Admin cannot delete their own account |
| `404` | User not found |

---

### 2.3 Transaction Endpoints

---

#### `POST /transactions`

Create a new financial transaction record.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin, Analyst |

**Request Body:**

```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-01-15",
  "description": "January salary payment"
}
```

| Field | Type | Required | Rules |
|-------|------|:--------:|-------|
| `amount` | Number | ✅ | Must be greater than `0.01` |
| `type` | String | ✅ | `income` or `expense` |
| `category` | String | ✅ | One of the 12 valid categories |
| `date` | Date | ❌ | ISO 8601 format. Defaults to current date |
| `description` | String | ❌ | Max 500 characters |

**Success Response `201`:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Transaction created successfully",
  "data": {
    "_id": "661b3c...",
    "createdBy": "661a2f...",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "date": "2024-01-15T00:00:00.000Z",
    "description": "January salary payment",
    "createdAt": "2024-04-05T...",
    "updatedAt": "2024-04-05T..."
  }
}
```

---

#### `GET /transactions`

Retrieve a paginated and filtered list of transactions.
Admins see all transactions. Analysts and Viewers see only their own.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | Number | Page number (default: `1`) |
| `limit` | Number | Results per page (default: `10`) |
| `type` | String | Filter by `income` or `expense` |
| `category` | String | Filter by category name (e.g. `Salary`) |
| `search` | String | Full-text search on description |
| `startDate` | Date | Return transactions on or after this date |
| `endDate` | Date | Return transactions on or before this date |

**Example:** `GET /transactions?type=expense&category=Food&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=5`

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transactions fetched successfully",
  "data": {
    "transactions": [ { "transaction objects..." } ],
    "total": 50,
    "page": 1,
    "totalPages": 10
  }
}
```

---

#### `GET /transactions/:id`

Retrieve a single transaction by ID.
Analysts and Viewers can only access their own records.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Success Response `200`:** Single transaction object with `createdBy` populated (name and email).

**Error Responses:**

| Code | Reason |
|------|--------|
| `403` | You are not authorized to view this transaction |
| `404` | Transaction not found |

---

#### `PUT /transactions/:id`

Update one or more fields of an existing transaction.
Analysts can only edit their own. Admins can edit any.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin, Analyst |

**Request Body:** Any subset of the following fields (at least one required):

```json
{
  "amount": 6000,
  "type": "income",
  "category": "Freelance",
  "date": "2024-02-10",
  "description": "Updated client payment"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transaction updated successfully",
  "data": { "updated transaction object" }
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | No fields provided for update |
| `403` | You can only edit your own transactions |
| `404` | Transaction not found |

---

#### `DELETE /transactions/:id`

Soft-delete a transaction. The record is hidden but not permanently removed.
Analysts can only delete their own. Admins can delete any.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ Admin, Analyst |

**Request Body:** None

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transaction deleted successfully",
  "data": null
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `403` | You can only delete your own transactions |
| `404` | Transaction not found |

---

### 2.4 Dashboard Endpoints

> All dashboard routes require authentication. All roles have access.
> Admins see aggregated data for all users. Analysts and Viewers see their own data only.

---

#### `GET /dashboard/summary`

Returns a high-level financial summary including total income, expenses, net balance, and transaction count.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Request Body:** None

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Financial summary fetched successfully",
  "data": {
    "totalIncome": 93000,
    "totalExpenses": 6950,
    "totalTransactions": 8,
    "netBalance": 86050
  }
}
```

> Returns all zeros if no transactions exist for the user.

---

#### `GET /dashboard/categories`

Returns transaction totals grouped by category and type, sorted by highest amount first.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Request Body:** None

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category breakdown fetched successfully",
  "data": [
    { "category": "Salary",    "type": "income",  "totalAmount": 75000, "count": 1 },
    { "category": "Freelance", "type": "income",  "totalAmount": 15000, "count": 1 },
    { "category": "Rent",      "type": "expense", "totalAmount": 1200,  "count": 1 },
    { "category": "Food",      "type": "expense", "totalAmount": 500,   "count": 1 }
  ]
}
```

---

#### `GET /dashboard/trends`

Returns month-by-month income and expense totals for a full calendar year.
Always returns all 12 months — months with no activity return zeros.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Query Parameters:**

| Param | Required | Default | Description |
|-------|:--------:|---------|-------------|
| `year` | ✅ | — | Integer year between 2000 and 2100 (e.g. `2024`) |

**Example:** `GET /dashboard/trends?year=2024`

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Monthly trends fetched successfully",
  "data": [
    { "month": 1,  "income": 0,     "expense": 800,  "net": -800  },
    { "month": 2,  "income": 3000,  "expense": 0,    "net": 3000  },
    { "month": 3,  "income": 15000, "expense": 450,  "net": 14550 },
    { "month": 4,  "income": 75000, "expense": 1700, "net": 73300 },
    { "month": 5,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 6,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 7,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 8,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 9,  "income": 0,     "expense": 0,    "net": 0     },
    { "month": 10, "income": 0,     "expense": 0,    "net": 0     },
    { "month": 11, "income": 0,     "expense": 0,    "net": 0     },
    { "month": 12, "income": 0,     "expense": 0,    "net": 0     }
  ]
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Year is missing, not a number, or out of 2000–2100 range |

---

#### `GET /dashboard/recent`

Returns the most recently dated N transactions with creator details.

| Property | Value |
|----------|-------|
| **Access** | Private |
| **Auth Required** | ✅ All roles |

**Query Parameters:**

| Param | Required | Default | Description |
|-------|:--------:|---------|-------------|
| `limit` | ❌ | `5` | Number of transactions to return. Min: 1, Max: 50 |

**Example:** `GET /dashboard/recent?limit=10`

**Success Response `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recent activity fetched successfully",
  "data": [
    {
      "_id": "661b3c...",
      "amount": 75000,
      "type": "income",
      "category": "Salary",
      "date": "2024-04-01T00:00:00.000Z",
      "description": "Monthly salary for April 2024",
      "createdBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-04-05T..."
    }
  ]
}
```

**Error Responses:**

| Code | Reason |
|------|--------|
| `400` | Limit is less than 1 or greater than 50 |

---

## Section 3: Common Error Response Format

Every error returned by this API — whether from a validator, service, middleware, or unexpected crash — follows this exact structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human readable error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

> The `errors` array is populated for validation failures. For non-validation errors it will be an empty array `[]`.

### HTTP Status Code Reference

| Code | Status Text           | When It Is Used                                          |
|------|-----------------------|----------------------------------------------------------|
| `200` | OK                   | Request succeeded; resource fetched or updated           |
| `201` | Created              | New resource successfully created                        |
| `400` | Bad Request          | Validation failed, missing fields, or invalid input      |
| `401` | Unauthorized         | Token is missing, expired, or invalid                    |
| `403` | Forbidden            | Valid token but insufficient role or ownership violation |
| `404` | Not Found            | Requested resource does not exist                        |
| `409` | Conflict             | Duplicate unique field (e.g. email already registered)   |
| `429` | Too Many Requests    | Rate limit exceeded; too many requests from this IP      |
| `500` | Internal Server Error| Unexpected server or database error                      |
