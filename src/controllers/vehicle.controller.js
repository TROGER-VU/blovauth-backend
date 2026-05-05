import {
  registerVehicleOnChain,
  getVehicleData,
  updateVehicleOnChain,
} from "../services/solana.service.js";

// 🔹 REGISTER VEHICLE
export const registerVehicle = async (req, res) => {
  try {
    const { did, hash } = req.body;

    // ✅ Input validation
    if (!did || !hash) {
      return res.status(400).json({
        success: false,
        message: "did and hash are required",
      });
    }

    const result = await registerVehicleOnChain(did, hash);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const msg = err.toString();

    // ✅ Duplicate PDA (already registered)
    if (
      msg.includes("already in use") ||
      msg.includes("AlreadyInitialized")
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle already registered",
      });
    }

    console.error("❌ Register Error:", err);

    return res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
};

// 🔹 VERIFY VEHICLE
export const verifyVehicle = async (req, res) => {
  try {
    const { did, hash } = req.body;

    // ✅ Validation
    if (!did || !hash) {
      return res.status(400).json({
        status: "INVALID",
        message: "did and hash required",
      });
    }

    const data = await getVehicleData(did);

    if (!data) {
      return res.json({
        status: "NOT_FOUND",
      });
    }

    const isValid = data.hash === hash;

    return res.json({
      status: isValid ? "AUTHORIZED" : "REJECTED",
      onChain: {
        owner: data.owner.toString(),
        did: data.did,
        hash: data.hash,
      },
    });
  } catch (err) {
    console.error("❌ Verify Error:", err);

    return res.status(500).json({
      status: "ERROR",
      message: "Verification failed",
    });
  }
};

// 🔹 UPDATE VEHICLE HASH
export const updateVehicle = async (req, res) => {
  try {
    const { did, newHash } = req.body;

    // ✅ Validation
    if (!did || !newHash) {
      return res.status(400).json({
        success: false,
        message: "did and newHash are required",
      });
    }

    const result = await updateVehicleOnChain(did, newHash);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const msg = err.toString();

    // ❌ Unauthorized update
    if (msg.includes("Unauthorized")) {
      return res.status(403).json({
        success: false,
        message: "Only owner can update vehicle",
      });
    }

    // ❌ PDA mismatch / seed error
    if (msg.includes("ConstraintSeeds")) {
      return res.status(400).json({
        success: false,
        message: "Invalid DID (PDA mismatch)",
      });
    }

    console.error("❌ Update Error:", err);

    return res.status(500).json({
      success: false,
      error: "Update failed",
    });
  }
};