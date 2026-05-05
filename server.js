import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import cors from "cors";
import vehicleRoutes from "./src/routes/vehicle.routes.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ API Routes
app.use("/api", vehicleRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});