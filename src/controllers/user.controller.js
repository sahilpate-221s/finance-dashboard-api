const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const userService = require("../services/user.service");

const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, role, isActive } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, isActive });
    return res.status(200).json(
        new ApiResponse(200, result, "Users fetched successfully")
    );
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

const updateUserRole = asyncHandler(async (req, res) => {
    const user = await userService.updateUserRole(
        req.params.id,
        req.body.role,
        req.user._id
    );
    return res.status(200).json(
        new ApiResponse(200, user, "User role updated successfully")
    );
});

const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await userService.toggleUserStatus(req.params.id, req.user._id);
    return res.status(200).json(
        new ApiResponse(200, user, "User status updated successfully")
    );
});

const removeUser = asyncHandler(async (req, res) => {
    await userService.removeUser(req.params.id, req.user._id);
    return res.status(200).json(
        new ApiResponse(200, null, "User removed successfully")
    );
});

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, removeUser };
