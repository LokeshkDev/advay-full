import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  monthly: { type: Number, required: true },
  months: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
});

export default mongoose.model("Plan", planSchema);
