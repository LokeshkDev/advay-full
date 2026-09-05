import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: false,
        },
        customer: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            address: { type: String, default: "" },
            pincode: { type: String, default: "" },
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
