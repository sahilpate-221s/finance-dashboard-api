const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Transaction must belong to a user"],
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than 0"],
        },
        type: {
            type: String,
            enum: {
                values: ["income", "expense"],
                message: "Type must be income or expense",
            },
            required: [true, "Transaction type is required"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            enum: {
                values: [
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
                ],
                message: "Invalid category",
            },
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
            default: Date.now,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
            default: "",
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    { timestamps: true }
);

// Compound index for optimized filtering queries
transactionSchema.index({ createdBy: 1, type: 1, category: 1, date: -1 });

// Text index to allow searching through transaction descriptions
transactionSchema.index({ description: "text" });

// Pre-find middleware: automatically filter out soft-deleted records
const FIND_METHODS = [
    "find",
    "findOne",
    "findById",
    "findOneAndUpdate",
    "findByIdAndUpdate",
    "findOneAndDelete",
    "findByIdAndDelete",
    "countDocuments",
];

FIND_METHODS.forEach((method) => {
    transactionSchema.pre(method, function (next) {
        if (this.getFilter().isDeleted === undefined) {
            this.where({ isDeleted: false });
        }
        next();
    });
});

module.exports = mongoose.model("Transaction", transactionSchema);
