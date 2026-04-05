const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const transactionService = require("../services/transaction.service");

const createTransaction = asyncHandler(async (req, res) => {
    const transaction = await transactionService.createTransaction(
        req.user._id,
        req.body
    );
    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction created successfully")
    );
});

const getAllTransactions = asyncHandler(async (req, res) => {
    const result = await transactionService.fetchTransactions(
        req.user._id,
        req.user.role,
        req.query
    );
    return res.status(200).json(
        new ApiResponse(200, result, "Transactions fetched successfully")
    );
});

const getTransactionById = asyncHandler(async (req, res) => {
    const transaction = await transactionService.fetchTransactionById(
        req.params.id,
        req.user._id,
        req.user.role
    );
    return res.status(200).json(
        new ApiResponse(200, transaction, "Transaction fetched successfully")
    );
});

const updateTransaction = asyncHandler(async (req, res) => {
    const transaction = await transactionService.modifyTransaction(
        req.params.id,
        req.user._id,
        req.user.role,
        req.body
    );
    return res.status(200).json(
        new ApiResponse(200, transaction, "Transaction updated successfully")
    );
});

const deleteTransaction = asyncHandler(async (req, res) => {
    await transactionService.softDeleteTransaction(
        req.params.id,
        req.user._id,
        req.user.role
    );
    return res.status(200).json(
        new ApiResponse(200, null, "Transaction deleted successfully")
    );
});

module.exports = {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
