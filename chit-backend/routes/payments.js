import express from "express";
import Payment from "../models/Payment.js";
import Member from "../models/Member.js";

const router = express.Router();

// ✅ Get all payments
router.get("/", async (req, res) => {
  const payments = await Payment.find().populate("memberId planId");
  res.json(payments);
});

router.post("/", async (req, res) => {
  const { memberId, planId, period, amount, paymentMode, transactionNo, paymentDate } = req.body;
  const cycle = req.body.cycle ? Number(req.body.cycle) : 1;

  let payment = await Payment.findOne({ memberId, period, cycle });

  // ---------------------------------------------------
  // CASE 1 : If record exists → TOGGLE LOGIC
  // ---------------------------------------------------
  if (payment) {

    // 🔴 CASE 1A: Paid → Pending
    if (payment.status === "Paid") {
      payment.status = "Pending";
      payment.paymentDate = null;
      payment.paymentMode = null;
      payment.transactionNo = null;
      payment.amount = amount;
      await payment.save();
      return res.json({ message: "Changed to Pending", payment });
    }

    // 🟢 CASE 1B: Pending → Paid
    if (payment.status === "Pending") {
      payment.status = "Paid";
      payment.amount = amount;
      payment.paymentMode = paymentMode || "Cash";
      payment.transactionNo = transactionNo || null;
      payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date(); // use provided date or current date
      await payment.save();
      return res.json({ message: "Changed to Paid", payment });
    }
  }

  // ---------------------------------------------------
  // CASE 2 : Create new Paid record
  // ---------------------------------------------------
  payment = new Payment({
    memberId,
    planId,
    period,
    amount,
    paymentMode: paymentMode || "Cash",
    transactionNo: transactionNo || null,
    status: "Paid",
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    cycle,
  });

  await payment.save();
  return res.status(201).json({ message: "Payment created", payment });
});

// ✅ Avail Again for Member (Start fresh cycle from Due1)
router.post("/avail-again", async (req, res) => {
  try {
    const { memberId } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    const nextCycle = (member.cycle || 1) + 1;
    member.cycle = nextCycle;
    await member.save();
    return res.json({ message: `Cycle ${nextCycle} started successfully`, member, cycle: nextCycle });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Update (if needed)
router.put("/:id", async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(payment);
});

// ✅ Delete payment
router.delete("/:id", async (req, res) => {
  await Payment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
