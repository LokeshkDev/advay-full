import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import "./db.js";
import { verifyEmailConnection } from "./utils/email.js";

import plansRouter from "./routes/plans.js";
import membersRouter from "./routes/members.js";
import paymentsRouter from "./routes/payments.js";
import reportsRouter from "./routes/reports.js";
import authRoutes from "./routes/auth.js";
import enquiryRouter from "./routes/enquiry.js";
import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

console.log("🔥 USING CORRECT server.js FILE - VERSION 5.0 - FIXED 🔥");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOG ALL REQUESTS
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Test JSON route
app.post("/api/test", (req, res) => {
  console.log("TEST BODY:", req.body);
  res.json({ received: req.body });
});

// Routes
app.use("/api/plans", plansRouter);
app.use("/api/members", membersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/auth", authRoutes);
app.use("/api/enquiry", enquiryRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await verifyEmailConnection();
});
