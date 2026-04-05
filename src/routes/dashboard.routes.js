const express = require("express");
const router = express.Router();

const {
    getFinancialSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentActivity,
} = require("../controllers/dashboard.controller");
const protect = require("../middleware/auth");
const authorize = require("../middleware/roleGuard");

router.use(protect, authorize("admin", "analyst", "viewer"));

router.get("/summary", getFinancialSummary);
router.get("/categories", getCategoryBreakdown);
router.get("/trends", getMonthlyTrends);
router.get("/recent", getRecentActivity);

module.exports = router;
