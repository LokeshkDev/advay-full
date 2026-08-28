import express from "express";
import Member from "../models/Member.js";
const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  const members = await Member.find().populate("planId");
  res.json(members);
});

// POST new
router.post("/", async (req, res) => {
  const member = new Member(req.body);
  await member.save();
  res.status(201).json(member);
});

// PUT update
router.put("/:id", async (req, res) => {
  const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(member);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
