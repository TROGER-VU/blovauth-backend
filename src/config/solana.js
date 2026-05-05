import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

const keypair = JSON.parse(process.env.PRIVATE_KEY);

const wallet = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(keypair)
);

const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(wallet),
  {}
);

anchor.setProvider(provider);

export const PROGRAM_ID = new PublicKey(
  "Gwaf9GcLo68Rve4QbfuMW7ou4JkSdeCqz2DWNNTUdvgL"
);