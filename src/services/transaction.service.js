const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

const createTransaction = async (userId, data) => {
    const transaction = await Transaction.create({ createdBy: userId, ...data });
    return transaction;
};

const fetchTransactions = async (userId, role, query) => {
    const filter = {};

    if (role !== "admin") filter.createdBy = userId;
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;

    if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = new Date(query.startDate);
        if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    if (query.search) {
        filter.$text = { $search: query.search };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        Transaction.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate("createdBy", "name email role"),
        Transaction.countDocuments(filter),
    ]);

    return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

const fetchTransactionById = async (id, userId, role) => {
    const transaction = await Transaction.findById(id).populate(
        "createdBy",
        "name email role"
    );

    if (!transaction) throw new ApiError(404, "Transaction not found.");

    if (
        role !== "admin" &&
        transaction.createdBy._id.toString() !== userId.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to view this transaction."
        );
    }

    return transaction;
};

const modifyTransaction = async (id, userId, role, data) => {
    const transaction = await Transaction.findById(id);

    if (!transaction) throw new ApiError(404, "Transaction not found.");

    if (
        role !== "admin" &&
        transaction.createdBy.toString() !== userId.toString()
    ) {
        throw new ApiError(403, "You can only edit your own transactions.");
    }

    const allowedFields = ["amount", "type", "category", "date", "description"];
    allowedFields.forEach((field) => {
        if (data[field] !== undefined) transaction[field] = data[field];
    });

    await transaction.save();
    return transaction;
};

const softDeleteTransaction = async (id, userId, role) => {
    // Explicitly pass isDeleted in filter to bypass the pre-find middleware
    // which only injects { isDeleted: false } when the field is undefined
    const transaction = await Transaction.findOne({ _id: id, isDeleted: false });

    if (!transaction) throw new ApiError(404, "Transaction not found.");

    if (
        role !== "admin" &&
        transaction.createdBy.toString() !== userId.toString()
    ) {
        throw new ApiError(403, "You can only delete your own transactions.");
    }

    transaction.isDeleted = true;
    await transaction.save();
    return transaction;
};

module.exports = {
    createTransaction,
    fetchTransactions,
    fetchTransactionById,
    modifyTransaction,
    softDeleteTransaction,
};
