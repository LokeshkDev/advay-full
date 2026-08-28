import express from "express";
import Plan from "../models/Plan.js";
const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  const plans = await Plan.find().sort({ _id: -1 });
  res.json(plans);
});

// POST new
router.post("/", async (req, res) => {
  const plan = new Plan(req.body);
  await plan.save();
  res.status(201).json(plan);
});

// PUT update
router.put("/:id", async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(plan);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
