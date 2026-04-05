const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const registerUser = async ({ name, email, password, role }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exists.");
    }

    const user = await User.create({ name, email, password, role });
    return user;
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password.");
    }

    return user;
};

module.exports = { registerUser, loginUser };
