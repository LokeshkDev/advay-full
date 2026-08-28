import express from "express";
import Plan from "../models/Plan.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Enquiry from "../models/Enquiry.js";
import Customer from "../models/Customer.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const plans = await Plan.find();
    const members = await Member.find().populate("planId");
    const payments = await Payment.find({ status: "Paid" }).populate("planId memberId");

    const totalPlans = plans.length;
    const totalMembers = members.length;
    const totalCollection = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // ------------------------------
    // Plan-wise summary
    // ------------------------------
    const planWise = plans.map((plan) => {
      const planPayments = payments.filter(
        (p) =>
          p.planId &&
          p.planId._id &&
          p.planId._id.toString() === plan._id.toString()
      );

      const planMembers = members.filter(
        (m) =>
          m.planId &&
          m.planId._id &&
          m.planId._id.toString() === plan._id.toString()
      );

      const collected = planPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const totalExpected = planMembers.length * plan.monthly * plan.months;
      const pending = totalExpected - collected;

      return {
        planName: plan.name,
        totalMembers: planMembers.length,
        collected,
        pending,
      };
    });

    // ------------------------------
    // Pending members calculation
    // ------------------------------
    const pendingMembers = members.filter((m) => {
      if (!m.planId || !m.planId._id) return false;

      const plan = plans.find(
        (p) => p._id && p._id.toString() === m.planId._id.toString()
      );

      if (!plan) return false;

      const currentCycle = m.cycle || 1;
      const paidMonths = payments.filter(
        (p) =>
          p.memberId &&
          p.memberId._id &&
          p.memberId._id.toString() === m._id.toString() &&
          (p.cycle || 1) === currentCycle
      ).length;

      return paidMonths < plan.months;
    }).length;

    res.json({
      totalPlans,
      totalMembers,
      totalCollection,
      pendingMembers,
      planWise,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const plans = await Plan.find();
    const members = await Member.find()
      .populate("planId")
      .sort({ _id: -1 })
      .limit(5);

    const payments = await Payment.find()
      .populate("memberId planId")
      .sort({ paymentDate: -1 })
      .limit(5);

    const paymentsPaid = await Payment.find({ status: "Paid" });
    const totalCollection = paymentsPaid.reduce((s, p) => s + (p.amount || 0), 0);

    const totalPlans = plans.length;
    const totalMembers = await Member.countDocuments();
    const totalOrders = await Enquiry.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const newOrdersCount = await Enquiry.countDocuments({ status: "new" });

    const totalOrderAmountResult = await Enquiry.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalOrderAmount = totalOrderAmountResult[0]?.total || 0;

    const latestOrders = await Enquiry.find()
      .populate("customerId")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalPlans,
      totalMembers,
      totalCollection,
      totalOrders,
      totalCustomers,
      newOrdersCount,
      totalOrderAmount,
      latestMembers: members,
      recentPayments: payments,
      latestOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
