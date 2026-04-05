const express = require("express");
const router = express.Router();

const {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} = require("../controllers/transaction.controller");
const protect = require("../middleware/auth");
const authorize = require("../middleware/roleGuard");
const {
    createTransactionValidator,
    updateTransactionValidator,
} = require("../validators/transaction.validator");

// createTransactionValidator and updateTransactionValidator
// already include handleValidationErrors at the end of their arrays

router.post(
    "/",
    protect,
    authorize("admin", "analyst"),
    createTransactionValidator,
    createTransaction
);

router.get(
    "/",
    protect,
    authorize("admin", "analyst", "viewer"),
    getAllTransactions
);

router.get(
    "/:id",
    protect,
    authorize("admin", "analyst", "viewer"),
    getTransactionById
);

router.put(
    "/:id",
    protect,
    authorize("admin", "analyst"),
    updateTransactionValidator,
    updateTransaction
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "analyst"),
    deleteTransaction
);

module.exports = router;
