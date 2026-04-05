const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

// Helper: builds the base $match stage for all pipelines
const buildMatchStage = (userId, role) => {
    const match = { isDeleted: false };
    if (role !== "admin") {
        match.createdBy = new mongoose.Types.ObjectId(userId);
    }
    return match;
};

const getFinancialSummary = async (userId, role) => {
    const result = await Transaction.aggregate([
        { $match: buildMatchStage(userId, role) },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                    },
                },
                totalExpenses: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                    },
                },
                totalTransactions: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                totalIncome: 1,
                totalExpenses: 1,
                totalTransactions: 1,
                netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
            },
        },
    ]);

    return result.length > 0
        ? result[0]
        : { totalIncome: 0, totalExpenses: 0, totalTransactions: 0, netBalance: 0 };
};

const getCategoryBreakdown = async (userId, role) => {
    const result = await Transaction.aggregate([
        { $match: buildMatchStage(userId, role) },
        {
            $group: {
                _id: { category: "$category", type: "$type" },
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                category: "$_id.category",
                type: "$_id.type",
                totalAmount: 1,
                count: 1,
            },
        },
        { $sort: { totalAmount: -1 } },
    ]);

    return result;
};

const getMonthlyTrends = async (userId, role, year) => {
    const parsedYear = parseInt(year);
    if (
        !year ||
        isNaN(parsedYear) ||
        parsedYear < 2000 ||
        parsedYear > 2100
    ) {
        throw new ApiError(400, "Please provide a valid year between 2000 and 2100.");
    }

    const baseMatch = buildMatchStage(userId, role);

    const result = await Transaction.aggregate([
        {
            $match: {
                ...baseMatch,
                $expr: { $eq: [{ $year: "$date" }, parsedYear] },
            },
        },
        {
            $group: {
                _id: { month: { $month: "$date" }, type: "$type" },
                total: { $sum: "$amount" },
            },
        },
        {
            $group: {
                _id: "$_id.month",
                income: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.type", "income"] }, "$total", 0],
                    },
                },
                expense: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.type", "expense"] }, "$total", 0],
                    },
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Build a lookup map from aggregation result
    const monthMap = {};
    result.forEach((item) => {
        monthMap[item._id] = {
            income: item.income,
            expense: item.expense,
        };
    });

    // Fill in all 12 months, even if no transactions exist
    const trends = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const data = monthMap[month] || { income: 0, expense: 0 };
        return {
            month,
            income: data.income,
            expense: data.expense,
            net: data.income - data.expense,
        };
    });

    return trends;
};

const getRecentActivity = async (userId, role, limit = 5) => {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        throw new ApiError(400, "Limit must be a number between 1 and 50.");
    }

    const result = await Transaction.aggregate([
        { $match: buildMatchStage(userId, role) },
        { $sort: { date: -1 } },
        { $limit: parsedLimit },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                    { $project: { name: 1, email: 1, _id: 0 } },
                ],
            },
        },
        {
            $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true,
            },
        },
    ]);

    return result;
};

module.exports = {
    getFinancialSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentActivity,
};
