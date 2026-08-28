import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  startDate: { type: Date, required: true },
  cycle: { type: Number, default: 1 },
});

export default mongoose.model("Member", memberSchema);
