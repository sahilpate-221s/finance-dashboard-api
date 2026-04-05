const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const getAllUsers = async ({ page = 1, limit = 10, role, isActive }) => {
    const filter = {};
    if (role !== undefined) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true" || isActive === true;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .select("-password");

    return {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
    };
};

const getUserById = async (id) => {
    const user = await User.findById(id).select("-password");
    if (!user) throw new ApiError(404, "User not found.");
    return user;
};

const updateUserRole = async (id, role, requestingUserId) => {
    if (id.toString() === requestingUserId.toString()) {
        throw new ApiError(400, "You cannot change your own role.");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) throw new ApiError(404, "User not found.");
    return user;
};

const toggleUserStatus = async (id, requestingUserId) => {
    if (id.toString() === requestingUserId.toString()) {
        throw new ApiError(400, "You cannot deactivate your own account.");
    }

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found.");

    user.isActive = !user.isActive;
    await user.save();
    return user;
};

const removeUser = async (id, requestingUserId) => {
    if (id.toString() === requestingUserId.toString()) {
        throw new ApiError(400, "You cannot delete your own account.");
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(404, "User not found.");
};

module.exports = { getAllUsers, getUserById, updateUserRole, toggleUserStatus, removeUser };
