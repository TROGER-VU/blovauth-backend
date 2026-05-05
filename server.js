import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import vehicleRoutes from "./src/routes/vehicle.routes.js";

const app = express();

// 🔹 Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// 🔹 Request logger (optional but useful)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// 🔹 Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// 🔹 Routes
app.use("/api", vehicleRoutes);

// 🔹 Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

// 🔹 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});