const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const dashboardService = require("../services/dashboard.service");

const getFinancialSummary = asyncHandler(async (req, res) => {
    const summary = await dashboardService.getFinancialSummary(
        req.user._id,
        req.user.role
    );
    return res.status(200).json(
        new ApiResponse(200, summary, "Financial summary fetched successfully")
    );
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
    const breakdown = await dashboardService.getCategoryBreakdown(
        req.user._id,
        req.user.role
    );
    return res.status(200).json(
        new ApiResponse(200, breakdown, "Category breakdown fetched successfully")
    );
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
    const trends = await dashboardService.getMonthlyTrends(
        req.user._id,
        req.user.role,
        req.query.year
    );
    return res.status(200).json(
        new ApiResponse(200, trends, "Monthly trends fetched successfully")
    );
});

const getRecentActivity = asyncHandler(async (req, res) => {
    const activity = await dashboardService.getRecentActivity(
        req.user._id,
        req.user.role,
        req.query.limit
    );
    return res.status(200).json(
        new ApiResponse(200, activity, "Recent activity fetched successfully")
    );
});

module.exports = {
    getFinancialSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentActivity,
};
