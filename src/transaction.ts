import { ComputeBudgetProgram, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

import { PROGRAM_ID, type Market } from "./markets.js";
import { ata, COMPUTE_UNIT_LIMIT, type OnChain } from "./stripr.js";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
// PayBox replaces this placeholder with a fresh blockhash before simulation and signing.
const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";
// app/src/idl/stripr.json instructions[strip].discriminator
const STRIP_DISCRIMINATOR = Buffer.from([246, 68, 231, 141, 62, 163, 189, 126]);
// app/src/idl/stripr.json instructions[redeem].discriminator
const REDEEM_DISCRIMINATOR = Buffer.from([184, 12, 86, 149, 70, 196, 97, 225]);
// programs/stripr/src/constants.rs UNDERLYING_VAULT_SEED
const UNDERLYING_VAULT_SEED = Buffer.from("underlying_vault");

/** Returns the wallet key, or undefined if it is not a valid on-curve Solana address. */
export function parseWallet(address: string): PublicKey | undefined {
  try {
    const key = new PublicKey(address);
    return key.toBase58() === address && PublicKey.isOnCurve(key.toBytes()) ? key : undefined;
  } catch {
    return undefined;
  }
}

type Accounts = {
  programId: PublicKey; marketKey: PublicKey; underlyingMint: PublicKey; ptMint: PublicKey; ytMint: PublicKey;
  tokenProgram: PublicKey; underlyingVault: PublicKey;
};

function accounts(market: Market, chain: OnChain): Accounts {
  const programId = new PublicKey(PROGRAM_ID);
  const marketKey = new PublicKey(market.market);
  const [underlyingVault] = PublicKey.findProgramAddressSync([UNDERLYING_VAULT_SEED, marketKey.toBuffer()], programId);
  return {
    programId, marketKey, underlyingVault,
    underlyingMint: new PublicKey(market.mint),
    ptMint: new PublicKey(chain.ptMint),
    ytMint: new PublicKey(chain.ytMint),
    tokenProgram: new PublicKey(chain.tokenProgram),
  };
}

function instructionData(discriminator: Buffer, value: bigint): Buffer {
  const data = Buffer.alloc(16);
  discriminator.copy(data, 0);
  data.writeBigUInt64LE(value, 8);
  return data;
}

/** Compute budget as the Stripr app sets it, then the instruction. The wallet is the only signer and the fee payer. */
function serialize(user: PublicKey, priorityMicroLamports: number, instruction: TransactionInstruction): string {
  const transaction = new Transaction({ feePayer: user, recentBlockhash: PLACEHOLDER_BLOCKHASH }).add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityMicroLamports }),
    instruction,
  );
  return transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

/** Unsigned legacy `strip` transaction: deposits `raw` xStock, mints PT + YT. */
export function buildStripTransaction(market: Market, chain: OnChain, user: PublicKey, raw: bigint): string {
  const a = accounts(market, chain);
  // Account order and flags follow app/src/idl/stripr.json instructions[strip].accounts.
  return serialize(user, chain.priorityMicroLamports, new TransactionInstruction({
    programId: a.programId,
    data: instructionData(STRIP_DISCRIMINATOR, raw),
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: a.marketKey, isSigner: false, isWritable: true },
      { pubkey: a.underlyingMint, isSigner: false, isWritable: false },
      { pubkey: a.ptMint, isSigner: false, isWritable: true },
      { pubkey: a.ytMint, isSigner: false, isWritable: true },
      { pubkey: a.underlyingVault, isSigner: false, isWritable: true },
      { pubkey: ata(user, a.underlyingMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: ata(user, a.ptMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: ata(user, a.ytMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: a.tokenProgram, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
  }));
}

/** Unsigned legacy `redeem` transaction: burns `shares` PT + YT, returns the xStock. */
export function buildRedeemTransaction(market: Market, chain: OnChain, user: PublicKey, shares: bigint): string {
  const a = accounts(market, chain);
  // Account order and flags follow app/src/idl/stripr.json instructions[redeem].accounts
  // (user is a read-only signer there; as fee payer it is writable in the message anyway).
  return serialize(user, chain.priorityMicroLamports, new TransactionInstruction({
    programId: a.programId,
    data: instructionData(REDEEM_DISCRIMINATOR, shares),
    keys: [
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: a.marketKey, isSigner: false, isWritable: true },
      { pubkey: a.underlyingMint, isSigner: false, isWritable: false },
      { pubkey: a.ptMint, isSigner: false, isWritable: true },
      { pubkey: a.ytMint, isSigner: false, isWritable: true },
      { pubkey: a.underlyingVault, isSigner: false, isWritable: true },
      { pubkey: ata(user, a.underlyingMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: ata(user, a.ptMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: ata(user, a.ytMint, a.tokenProgram), isSigner: false, isWritable: true },
      { pubkey: a.tokenProgram, isSigner: false, isWritable: false },
    ],
  }));
}
