import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
  period: String,
  amount: Number,
  status: { type: String, enum: ["Paid", "Pending"], default: "Paid" },
  paymentDate: { type: Date, default: Date.now },
  transactionNo: { type: String, default: null },
  paymentMode: { type: String, default: "Cash" }, // 👈 added field
  cycle: { type: Number, default: 1 },
});

export default mongoose.model("Payment", paymentSchema);
