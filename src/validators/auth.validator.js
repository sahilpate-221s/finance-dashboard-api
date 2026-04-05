const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const handleValidationErrors = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errorsArray = result.array().map((error) => ({
            field: error.path,
            message: error.msg,
        }));
        throw new ApiError(400, "Validation failed", errorsArray);
    }
    next();
};

const registerValidator = [
    body("name")
        .notEmpty().withMessage("Name is required")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),

    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
        .custom((value) => {
            if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
                throw new Error("Password must contain at least one letter and one number");
            }
            return true;
        }),

    body("role")
        .optional()
        .isIn(["viewer", "analyst", "admin"])
        .withMessage("Role must be viewer, analyst, or admin"),
];

const loginValidator = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email"),

    body("password")
        .notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidator, loginValidator, handleValidationErrors };
