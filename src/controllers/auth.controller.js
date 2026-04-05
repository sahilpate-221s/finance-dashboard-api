const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const user = await authService.registerUser({ name, email, password, role });
    const token = user.generateJwtToken();

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                },
            },
            "Account created successfully"
        )
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginUser({ email, password });
    const token = user.generateJwtToken();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                },
            },
            "Login successful"
        )
    );
});

const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Profile fetched successfully")
    );
});

module.exports = { register, login, getMe };
