const rateLimit = require("express-rate-limit");

/**
 * Strict limiter for auth endpoints that are brute-force targets.
 * Applies to: POST /auth/login and POST /auth/register
 * Max: 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many attempts from this IP. Please try again after 15 minutes.",
        errors: [],
    },
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,   // Disable X-RateLimit-* headers
});

/**
 * General limiter for all other API routes.
 * Protects against excessive scraping or API abuse.
 * Max: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
        errors: [],
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
