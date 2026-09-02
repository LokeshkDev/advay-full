import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String }, // Path to image
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    originalPrice: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);
