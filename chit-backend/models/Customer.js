import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    { timestamps: true }
);

// Prevent duplicate customers
customerSchema.index({ email: 1, phone: 1 }, { unique: true });

export default mongoose.model("Customer", customerSchema);