import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

// Update customer details (address, pincode, etc.)
router.patch("/:id", async (req, res) => {
    console.log(`[PATCH] Received request to update customer: ${req.params.id}`, req.body);
    try {
        const { address, pincode } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { address, pincode },
            { new: true }
        );

        if (!customer) {
            console.log(`[PATCH] Customer not found: ${req.params.id}`);
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        console.log(`[PATCH] Successfully updated customer: ${req.params.id}`);
        res.json({ success: true, data: customer });
    } catch (err) {
        console.error(`[PATCH] Error updating customer ${req.params.id}:`, err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
