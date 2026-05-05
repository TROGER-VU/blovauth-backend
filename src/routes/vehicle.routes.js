import express from "express";
import {
  registerVehicle,
  verifyVehicle,
  updateVehicle,
} from "../controllers/vehicle.controller.js";

const router = express.Router();

router.post("/register", registerVehicle);
router.post("/verify", verifyVehicle);
router.post("/update", updateVehicle);

export default router;