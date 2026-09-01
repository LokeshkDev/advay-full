import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();


/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Case-insensitive username lookup
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") }
    });

    if (!user)
      return res.status(401).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "default_jwt_secret_advay",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
