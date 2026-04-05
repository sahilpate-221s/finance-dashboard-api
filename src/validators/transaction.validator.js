const { body } = require("express-validator");
const { handleValidationErrors } = require("./auth.validator");

const VALID_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investment",
    "Business",
    "Food",
    "Rent",
    "Utilities",
    "Transport",
    "Healthcare",
    "Education",
    "Entertainment",
    "Other",
];

const UPDATABLE_FIELDS = ["amount", "type", "category", "date", "description"];

const createTransactionValidator = [
    body("amount")
        .notEmpty().withMessage("Amount is required")
        .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

    body("type")
        .notEmpty().withMessage("Transaction type is required")
        .isIn(["income", "expense"]).withMessage("Type must be income or expense"),

    body("category")
        .notEmpty().withMessage("Category is required")
        .isIn(VALID_CATEGORIES).withMessage("Invalid category"),

    body("date")
        .optional()
        .isISO8601().withMessage("Date must be a valid ISO 8601 date")
        .toDate(),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    handleValidationErrors,
];

const updateTransactionValidator = [
    body("amount")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

    body("type")
        .optional()
        .isIn(["income", "expense"]).withMessage("Type must be income or expense"),

    body("category")
        .optional()
        .isIn(VALID_CATEGORIES).withMessage("Invalid category"),

    body("date")
        .optional()
        .isISO8601().withMessage("Date must be a valid ISO 8601 date")
        .toDate(),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

    body().custom((value, { req }) => {
        const hasAtLeastOneField = UPDATABLE_FIELDS.some(
            (field) => req.body[field] !== undefined
        );
        if (!hasAtLeastOneField) {
            throw new Error("At least one field must be provided for update");
        }
        return true;
    }),

    handleValidationErrors,
];

module.exports = {
    createTransactionValidator,
    updateTransactionValidator,
    VALID_CATEGORIES,
};
