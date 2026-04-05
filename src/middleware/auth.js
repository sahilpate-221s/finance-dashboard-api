const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    let token;
    if (authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        throw new ApiError(401, "Access denied. No token provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
        throw new ApiError(401, "User belonging to this token no longer exists.");
    }

    if (!user.isActive) {
        throw new ApiError(
            403,
            "Your account has been deactivated. Contact an administrator."
        );
    }

    req.user = user;
    next();
});

module.exports = protect;
