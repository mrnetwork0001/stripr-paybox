import { PublicKey } from "@solana/web3.js";

import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID, type Market } from "./markets.js";

export const RPC_URL = "https://api.mainnet-beta.solana.com";
export const JUPITER_PRICE_URL = "https://lite-api.jup.ag/price/v3";
const FETCH_TIMEOUT_MS = 4_000;

// programs/stripr/src/constants.rs MULTIPLIER_ONE
export const MULTIPLIER_ONE = 1_000_000_000_000n;
// app/src/hooks/useStriprActions.ts COMPUTE_UNIT_LIMIT / MIN_MAINNET_PRIORITY_MICROLAMPORTS
export const COMPUTE_UNIT_LIMIT = 600_000;
export const MIN_PRIORITY_MICROLAMPORTS = 1_000;
const BASE_FEE_LAMPORTS = 5_000; // one signature

// Market account (programs/stripr/src/state.rs): 8-byte discriminator, then
// admin, underlying_mint, dividend_mint, pt_mint, yt_mint (32 bytes each),
// total_stripped u64, total_yt_locked u64, acc_dividend_per_yt u128,
// total_dividends u64, multiplier u128, ...
const MARKET_DISCRIMINATOR = Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]);
const MARKET_SIZE = 257;
const MULTIPLIER_OFFSET = 8 + 32 * 5 + 8 + 8 + 16 + 8;

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} responded ${response.status}`);
  return response.json();
}

export type TokenHolding = { address: string; mint: string; amount: bigint };

export type OnChain = {
  /** Raw market multiplier (never moves down). */
  marketMultiplier: bigint;
  /** The mint's scaled UI multiplier in force now, scaled like the program does. */
  mintMultiplier: bigint;
  decimals: number;
  ptMint: string;
  ytMint: string;
  tokenProgram: string;
  priorityMicroLamports: number;
  /** The wallet's Token-2022 accounts; null when no wallet was given. */
  holdings: TokenHolding[] | null;
};

type ScaledUiState = { multiplier?: string; newMultiplier?: string; newMultiplierEffectiveTimestamp?: number };

/** Mirrors programs/stripr/src/multiplier.rs current_multiplier. */
function mintMultiplier(owner: string, state: ScaledUiState | undefined, nowSeconds: number): bigint {
  if (owner !== TOKEN_2022_PROGRAM_ID || !state) return MULTIPLIER_ONE;
  const effectiveAt = state.newMultiplierEffectiveTimestamp ?? Number.POSITIVE_INFINITY;
  const multiplier = Number(nowSeconds >= effectiveAt ? state.newMultiplier : state.multiplier);
  const scaled = multiplier * Number(MULTIPLIER_ONE);
  if (!Number.isFinite(multiplier) || scaled < 1 || scaled >= 1e30) throw new Error("Invalid mint multiplier");
  return BigInt(Math.trunc(scaled));
}

/** One JSON-RPC batch over one HTTPS request; results come back in call order. */
async function rpcBatch(calls: { method: string; params: unknown[] }[]): Promise<unknown[]> {
  const body = await fetchJson(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(calls.map((call, id) => ({ jsonrpc: "2.0", id, ...call }))),
  });
  if (!Array.isArray(body)) throw new Error("Unexpected RPC response");
  const byId = new Map(body.map((entry: { id: number; result?: unknown; error?: { message?: string } }) => [entry.id, entry]));
  return calls.map((call, id) => {
    const entry = byId.get(id);
    if (!entry || entry.error) throw new Error(`RPC ${call.method} failed${entry?.error?.message ? `: ${entry.error.message}` : ""}`);
    return entry.result;
  });
}

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/** Associated token account address (same derivation as getAssociatedTokenAddressSync). */
export const ata = (owner: PublicKey, mint: PublicKey, tokenProgram: PublicKey) =>
  PublicKey.findProgramAddressSync([owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];

/**
 * The wallet's xStock, PT and YT token accounts for a market. All 15 xStocks are
 * Token-2022 (checked on mainnet), and PT/YT use the underlying's token program.
 * Deriving them avoids getTokenAccountsByOwner, which takes ~4s on the public RPC.
 */
function walletAccounts(market: Market, owner: string): string[] {
  const user = new PublicKey(owner);
  const program = new PublicKey(TOKEN_2022_PROGRAM_ID);
  return [market.mint, market.ptMint, market.ytMint].map((mint) => ata(user, new PublicKey(mint), program).toBase58());
}

type ParsedAccount = { owner: string; data: [string, string] | { parsed?: { info?: { mint?: string; tokenAmount?: { amount?: string } } } } } | null;

function toHolding(address: string, account: ParsedAccount): TokenHolding[] {
  if (!account || Array.isArray(account.data)) return [];
  const info = account.data.parsed?.info;
  return info?.mint && info.tokenAmount?.amount ? [{ address, mint: info.mint, amount: BigInt(info.tokenAmount.amount) }] : [];
}

type MarketFields = { ptMint: string; ytMint: string; multiplier: bigint };

function decodeMarket(market: Market, account: ParsedAccount): MarketFields {
  if (!account || !Array.isArray(account.data)) throw new Error("Market account not found");
  const data = Buffer.from(account.data[0], "base64");
  if (account.owner !== PROGRAM_ID || data.length !== MARKET_SIZE || !data.subarray(0, 8).equals(MARKET_DISCRIMINATOR)) {
    throw new Error("Account is not a Stripr market");
  }
  const lo = data.readBigUInt64LE(MULTIPLIER_OFFSET);
  const hi = data.readBigUInt64LE(MULTIPLIER_OFFSET + 8);
  const fields = {
    ptMint: new PublicKey(data.subarray(8 + 32 * 3, 8 + 32 * 4)).toBase58(),
    ytMint: new PublicKey(data.subarray(8 + 32 * 4, 8 + 32 * 5)).toBase58(),
    multiplier: (hi << 64n) | lo,
  };
  if (fields.ptMint !== market.ptMint || fields.ytMint !== market.ytMint) throw new Error("Market account PT/YT mints do not match the plugin's table");
  return fields;
}

/** One batched RPC round trip: market account, xStock mint, the wallet's three token accounts, recent priority fees. */
export async function readOnChain(market: Market, nowSeconds: number, owner?: string): Promise<OnChain> {
  const wallet = owner ? walletAccounts(market, owner) : [];
  const [accounts, feeRows] = await rpcBatch([
    { method: "getMultipleAccounts", params: [[market.market, market.mint, ...wallet], { encoding: "jsonParsed", commitment: "confirmed" }] },
    { method: "getRecentPrioritizationFees", params: [] },
  ]);
  const rows = ((accounts as { value?: unknown[] })?.value ?? []) as ParsedAccount[];
  const fields = decodeMarket(market, rows[0] ?? null);
  const mintAccount = rows[1] as { owner: string; data: { parsed?: { info?: { decimals?: number; extensions?: { extension: string; state: ScaledUiState }[] } } } } | null;
  if (!mintAccount) throw new Error("Mint account not found");
  const info = mintAccount.data.parsed?.info;
  if (typeof info?.decimals !== "number") throw new Error("Mint has no decimals");
  const scaled = info.extensions?.find((e) => e.extension === "scaledUiAmountConfig")?.state;

  // app/src/hooks/useStriprActions.ts computeBudgetInstructions: 75th percentile, floor 1,000.
  const fees = ((feeRows as { prioritizationFee: number }[] | undefined) ?? []).map((f) => f.prioritizationFee).sort((a, b) => a - b);
  const p75 = fees.length ? fees[Math.floor(fees.length * 0.75)] ?? 0 : 0;

  return {
    marketMultiplier: fields.multiplier,
    mintMultiplier: mintMultiplier(mintAccount.owner, scaled, nowSeconds),
    decimals: info.decimals,
    ptMint: fields.ptMint,
    ytMint: fields.ytMint,
    tokenProgram: mintAccount.owner,
    priorityMicroLamports: Math.max(MIN_PRIORITY_MICROLAMPORTS, p75),
    holdings: owner ? wallet.flatMap((address, i) => toHolding(address, rows[2 + i] ?? null)) : null,
  };
}

export type MarketPosition = { market: Market; multiplier: bigint; xstock: bigint; pt: bigint; yt: bigint };

/** All 15 market accounts plus the wallet's 45 token accounts, in one getMultipleAccounts call. */
export async function readPositions(markets: readonly Market[], owner: string): Promise<MarketPosition[]> {
  const wallet = markets.flatMap((m) => walletAccounts(m, owner));
  const [accounts] = await rpcBatch([
    { method: "getMultipleAccounts", params: [[...markets.map((m) => m.market), ...wallet], { encoding: "jsonParsed", commitment: "confirmed" }] },
  ]);
  const rows = ((accounts as { value?: unknown[] })?.value ?? []) as ParsedAccount[];
  const amount = (i: number) => toHolding(wallet[i]!, rows[markets.length + i] ?? null)[0]?.amount ?? 0n;
  return markets.map((market, i) => ({
    market,
    multiplier: decodeMarket(market, rows[i] ?? null).multiplier,
    xstock: amount(3 * i),
    pt: amount(3 * i + 1),
    yt: amount(3 * i + 2),
  }));
}

export type Quote = {
  /** Price of one xStock as displayed in a wallet (multiplier already in it). */
  xstockUsd: number | null;
  /** Reference price of the underlying share. */
  stockUsd: number | null;
  /** Timestamp of the reference price; null when Jupiter does not report one. */
  updatedAt: number | null;
  annualizedYield: number | null;
  decimals: number | null;
  /** Jupiter's view of the multiplier, used only when the RPC is unreachable. */
  multiplier: number | null;
};

type JupiterEntry = {
  usdPrice?: number;
  decimals?: number;
  createdAt?: string;
  stockData?: { price?: number; updatedAt?: string };
  scaledUiConfig?: { multiplier?: number; newMultiplier?: number; newMultiplierEffectiveAt?: string };
};

/** Mirrors app/src/app/api/prices/route.ts effectiveMultiplier. */
function jupiterMultiplier(config: JupiterEntry["scaledUiConfig"], nowMs: number): number | undefined {
  if (!config) return undefined;
  const effectiveAt = config.newMultiplierEffectiveAt ? Date.parse(config.newMultiplierEffectiveAt) : NaN;
  if (config.newMultiplier && Number.isFinite(effectiveAt) && nowMs >= effectiveAt) return config.newMultiplier;
  return config.multiplier ?? config.newMultiplier;
}

/** Mirrors app/src/app/api/prices/route.ts annualize: in-force multiplier growth since launch, annualized. */
function annualize(multiplier: number | undefined, createdAt: string | undefined, nowMs: number): number | null {
  if (!multiplier || multiplier <= 1 || !createdAt) return null;
  const days = (nowMs - Date.parse(createdAt)) / 86_400_000;
  if (!Number.isFinite(days) || days < 30) return null;
  return multiplier ** (365 / days) - 1;
}

export async function readQuote(market: Market, nowMs: number): Promise<Quote> {
  const body = (await fetchJson(`${JUPITER_PRICE_URL}?ids=${market.mint}`)) as Record<string, JupiterEntry | undefined>;
  const entry = body[market.mint];
  if (!entry) throw new Error("Jupiter has no price for this xStock");
  // Unlike the Stripr frontend, a missing timestamp stays missing so the gate can refuse on it.
  const updated = entry.stockData?.updatedAt ? Date.parse(entry.stockData.updatedAt) : NaN;
  const multiplier = jupiterMultiplier(entry.scaledUiConfig, nowMs);
  return {
    xstockUsd: positive(entry.usdPrice),
    stockUsd: positive(entry.stockData?.price),
    updatedAt: Number.isFinite(updated) ? updated : null,
    annualizedYield: annualize(multiplier, entry.createdAt, nowMs),
    decimals: typeof entry.decimals === "number" ? entry.decimals : null,
    multiplier: multiplier ?? null,
  };
}

const positive = (value: number | undefined) => (typeof value === "number" && value > 0 ? value : null);

/** The multiplier the next instruction syncs to (app/src/lib/stripr.ts effectiveMultiplier). */
export const effectiveMultiplier = (chain: Pick<OnChain, "marketMultiplier" | "mintMultiplier">) =>
  chain.mintMultiplier > chain.marketMultiplier ? chain.mintMultiplier : chain.marketMultiplier;

/** Market::shares_for_raw, rounded down. */
export const sharesForRaw = (raw: bigint, multiplier: bigint) => (raw * multiplier) / MULTIPLIER_ONE;

/** Market::raw_for_shares, rounded down. */
export const rawForShares = (shares: bigint, multiplier: bigint) => (shares * MULTIPLIER_ONE) / multiplier;

export function networkFeeLamports(priorityMicroLamports: number): number {
  return BASE_FEE_LAMPORTS + Math.ceil((priorityMicroLamports * COMPUTE_UNIT_LIMIT) / 1_000_000);
}

export function formatUnits(atomic: bigint, decimals: number): string {
  const text = atomic.toString().padStart(decimals + 1, "0");
  const whole = text.slice(0, text.length - decimals);
  const fraction = text.slice(text.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function formatMultiplier(multiplier: bigint): string {
  return formatUnits(multiplier, 12);
}
