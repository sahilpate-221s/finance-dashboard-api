const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authorize = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `You do not have permission to perform this action. Required role: [${allowedRoles.join(" or ")}]`
            );
        }
        next();
    });
};

module.exports = authorize;
