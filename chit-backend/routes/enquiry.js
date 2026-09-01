import express from "express";
import dotenv from "dotenv";
import Customer from "../models/Customer.js";
import Enquiry from "../models/Enquiry.js";
import { sendEnquiryEmails, verifyEmailConnection } from "../utils/email.js";

dotenv.config();

const router = express.Router();

console.log("✅ enquiry.js route file loaded");

// 🔍 Test Email Connection in Production
router.get("/test-email", async (req, res) => {
  try {
    const isConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const verified = await verifyEmailConnection();
    res.json({
      configured: isConfigured,
      emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, "$1***$2") : "Not set",
      smtpVerified: verified,
      message: verified ? "SMTP Connection Successful!" : "SMTP Connection Failed. Check EMAIL_USER and EMAIL_PASS (Gmail App Password)."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is missing. Ensure Content-Type is application/json",
    });
  }

  try {
    const { customer, cart, totalItems, totalPrice } = req.body;

    if (!customer || !cart) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (customer, cart)",
      });
    }

    /* ======================================================
       1️⃣ STORE CUSTOMER
    ====================================================== */

    let savedCustomer = await Customer.findOne({
      $or: [{ email: customer.email }, { phone: customer.phone }],
    });

    if (!savedCustomer) {
      savedCustomer = await Customer.create(customer);
    }

    /* ======================================================
       2️⃣ STORE ENQUIRY
    ====================================================== */

    const enquiry = await Enquiry.create({
      customerId: savedCustomer._id,
      cart,
      totalItems,
      totalPrice,
      agentId: customer.agentId || "",
    });

    /* ======================================================
       3️⃣ SEND EMAILS (ADMIN + CUSTOMER)
    ====================================================== */
    try {
      await sendEnquiryEmails({
        customer,
        cart,
        totalItems,
        totalPrice,
        agentId: customer.agentId || "",
      });
    } catch (emailErr) {
      console.error("❌ Email sending failed (enquiry still saved):", emailErr.message);
    }

    res.json({
      success: true,
      message: "Enquiry submitted successfully! Confirmation emails sent.",
      data: { enquiryId: enquiry._id },
    });
  } catch (err) {
    console.error("❌ Enquiry Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET ALL ENQUIRIES (ORDERS)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Customer search
    let customerFilter = {};
    if (search) {
      customerFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const enquiries = await Enquiry.find(query)
      .populate({
        path: "customerId",
        match: customerFilter,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Remove null populated customers (after search)
    const filtered = enquiries.filter(e => e.customerId);

    const total = await Enquiry.countDocuments(query);

    res.json({
      success: true,
      data: filtered,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("❌ Fetch Enquiries Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET SINGLE ENQUIRY (ORDER DETAILS)
router.get("/:id", async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id).populate("customerId");

    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BULK UPDATE STATUS
router.patch("/bulk-status", async (req, res) => {
  console.log("📦 [BULK STATUS] Request received:", req.body);
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      console.log("❌ [BULK STATUS] Validation failed:", { ids, status });
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }

    const result = await Enquiry.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );

    console.log("✅ [BULK STATUS] Update result:", result);

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} orders to ${status}`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("❌ [BULK STATUS] Update Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// BULK UPDATE REMARKS
router.patch("/bulk-remarks", async (req, res) => {
  try {
    const { ids, remarks } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }

    const result = await Enquiry.updateMany(
      { _id: { $in: ids } },
      { $set: { remarks } }
    );

    res.json({
      success: true,
      message: `Successfully updated remarks for ${result.modifiedCount} orders`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE ORDER STATUS OR REMARKS
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const update = {};
    if (status) update.status = status;
    if (remarks !== undefined) update.remarks = remarks;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE ENQUIRY (ORDER)
router.delete("/:id", async (req, res) => {
  console.log(`[DELETE] Received request to delete enquiry: ${req.params.id}`);
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      console.log(`[DELETE] Enquiry not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.log(`[DELETE] Successfully deleted enquiry: ${req.params.id}`);
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error(`[DELETE] Error deleting enquiry ${req.params.id}:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router;
