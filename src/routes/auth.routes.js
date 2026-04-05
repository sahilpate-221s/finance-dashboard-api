const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/auth.controller");
const { registerValidator, loginValidator, handleValidationErrors } = require("../validators/auth.validator");
const protect = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, registerValidator, handleValidationErrors, register);
router.post("/login", authLimiter, loginValidator, handleValidationErrors, login);
router.get("/me", protect, getMe);

module.exports = router;
