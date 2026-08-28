import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        cart: { type: Array, required: true },
        totalItems: Number,
        totalPrice: Number,
        agentId: { type: String, default: "" },
        status: {
            type: String,
            enum: ["new", "packing", "completed", "dispatched"],
            default: "new",
        },
        remarks: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("Enquiry", enquirySchema);
