import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import staffRoutes from "./routes/staff.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Allow both localhost (dev) and Vercel (prod)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://glowsuite-app.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "GlowSuite API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

app.use((err, _req, res, _next) => {
  console.error("[Error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`GlowSuite server running on http://localhost:${PORT}`);
});
