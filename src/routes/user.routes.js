const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    getUserById,
    updateUserRole,
    toggleUserStatus,
    removeUser,
} = require("../controllers/user.controller");
const protect = require("../middleware/auth");
const authorize = require("../middleware/roleGuard");

router.use(protect, authorize("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/status", toggleUserStatus);
router.delete("/:id", removeUser);

module.exports = router;
