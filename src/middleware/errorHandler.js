const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = "Resource not found";
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "unknown";
        message = `Duplicate field value: ${field}`;
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation Error";
        errors = Object.values(err.errors || {}).map((val) => val.message);
    } else {
        statusCode = 500;
        message = "Internal Server Error";
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors
    });
};

module.exports = errorHandler;
