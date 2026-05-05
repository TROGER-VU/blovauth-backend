import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import idl from "../idl/vehicle_auth.json" with { type: "json" };
import { provider, PROGRAM_ID } from "../config/solana.js";

const coder = new anchor.BorshCoder(idl);

// 🔹 Normalize DID (VERY IMPORTANT)
const normalizeDid = (did) => did.trim().toLowerCase();

// 🔹 PDA derivation (must match Rust seeds)
export const getVehiclePDA = (did) => {
  const didNorm = normalizeDid(did);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vehicle"), Buffer.from(didNorm)],
    PROGRAM_ID
  );

  return pda;
};

// 🔹 Common transaction sender (stable + safe)
const sendTx = async (connection, tx, signers) => {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  // 🧪 Simulation (helps debug errors)
  const sim = await connection.simulateTransaction(tx, signers);
  if (sim.value.err) {
    console.error("❌ Simulation failed:", sim.value.logs);
    throw new Error("Transaction simulation failed");
  }

  const signature = await connection.sendTransaction(tx, signers, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return signature;
};

// 🔹 REGISTER VEHICLE
export const registerVehicleOnChain = async (did, hash) => {
  const connection = provider.connection;
  const payer = provider.wallet.payer;

  // 🔒 Input validation
  if (!did || !hash) throw new Error("Missing did or hash");
  if (did.length > 256 || hash.length > 256)
    throw new Error("Input too large");

  const didNorm = normalizeDid(did);
  const pda = getVehiclePDA(didNorm);

  console.log("REGISTER PDA:", pda.toString());

  const data = coder.instruction.encode("register_vehicle", {
    did: didNorm,
    hash,
  });

  const ix = new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      {
        pubkey: anchor.web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });

  const tx = new Transaction().add(ix);

  const sig = await sendTx(connection, tx, [payer]);

  return {
    success: true,
    tx: sig,
    vehicleAddress: pda.toString(),
    explorerTx: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    explorerAccount: `https://explorer.solana.com/address/${pda.toString()}?cluster=devnet`,
  };
};

// 🔹 UPDATE VEHICLE HASH
export const updateVehicleOnChain = async (did, newHash) => {
  const connection = provider.connection;
  const payer = provider.wallet.payer;

  // 🔒 Input validation
  if (!did || !newHash) throw new Error("Missing did or newHash");
  if (newHash.length > 256)
    throw new Error("Hash too large");

  const didNorm = normalizeDid(did);
  const pda = getVehiclePDA(didNorm);

  console.log("UPDATE PDA:", pda.toString());

  const data = coder.instruction.encode("update_vehicle", {
    did: didNorm,
    new_hash: newHash,
  });

  const ix = new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    ],
    data,
  });

  const tx = new Transaction().add(ix);

  const sig = await sendTx(connection, tx, [payer]);

  return {
    success: true,
    tx: sig,
  };
};

// 🔹 FETCH VEHICLE DATA
export const getVehicleData = async (did) => {
  try {
    const didNorm = normalizeDid(did);
    const pda = getVehiclePDA(didNorm);

    console.log("FETCH PDA:", pda.toString());

    const accountInfo = await provider.connection.getAccountInfo(pda);
    if (!accountInfo) return null;

    const decoded = coder.accounts.decode("Vehicle", accountInfo.data);

    // ⚠️ Sanity check
    if (decoded.did !== didNorm) {
      console.warn("⚠️ DID mismatch!", {
        requested: didNorm,
        onchain: decoded.did,
      });
    }

    return decoded;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return null;
  }
};