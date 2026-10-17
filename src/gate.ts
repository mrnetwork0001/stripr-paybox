// Deterministic pre-trade gate for split_position. Plain rule checks: the same
// inputs (including `nowMs`) always give the same verdict. No I/O, no model.

import { MARKETS } from "./markets.js";

export type GateConfig = {
  maxPriceAgeSeconds: number;
  maxNotionalUsd: number;
  defaultMaxSlippageBps: number;
  allowedMarkets: readonly string[];
};

export const DEFAULT_CONFIG: GateConfig = {
  maxPriceAgeSeconds: 900,
  maxNotionalUsd: 5_000,
  defaultMaxSlippageBps: 100,
  allowedMarkets: MARKETS.map((m) => m.ticker),
};

/** Reads non-secret settings from portal environment variables; unset means default. */
export function loadConfig(env: Record<string, string | undefined>): GateConfig {
  const number = (name: string, fallback: number) => {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
    return value;
  };
  const list = env.STRIPR_ALLOWED_MARKETS?.trim();
  return {
    maxPriceAgeSeconds: number("STRIPR_MAX_PRICE_AGE_SECONDS", DEFAULT_CONFIG.maxPriceAgeSeconds),
    maxNotionalUsd: number("STRIPR_MAX_NOTIONAL_USD", DEFAULT_CONFIG.maxNotionalUsd),
    defaultMaxSlippageBps: number("STRIPR_DEFAULT_MAX_SLIPPAGE_BPS", DEFAULT_CONFIG.defaultMaxSlippageBps),
    allowedMarkets: list ? list.split(",").map((t) => t.trim()).filter(Boolean) : DEFAULT_CONFIG.allowedMarkets,
  };
}

export type GateInput = {
  /** Resolved market ticker, or undefined if the ticker matched no Stripr market. */
  ticker: string | undefined;
  requestedTicker: string;
  nowMs: number;
  priceUpdatedAt: number | null;
  /** On-chain xStock price (Jupiter usdPrice). */
  xstockUsd: number | null;
  /** Reference price of the underlying share (Jupiter stockData.price). */
  stockUsd: number | null;
  /** Wallet-displayed xStock amount being split. */
  amount: number;
  maxSlippageBps: number | undefined;
};

export type Check = { rule: string; code: string; passed: boolean; detail: string };
export type Verdict = { allowed: boolean; checks: Check[] };

/** SG-04 on its own: the market must be a known Stripr market and on the configured allowlist. */
export function checkMarket(input: Pick<GateInput, "ticker" | "requestedTicker">, config: GateConfig): Check {
  const known = input.ticker !== undefined;
  const allowed = known && config.allowedMarkets.some((t) => t.toLowerCase() === input.ticker!.toLowerCase());
  return {
    rule: "SG-04", code: "unknown_market", passed: allowed,
    detail: allowed ? `${input.ticker} is allowlisted`
      : known ? `${input.ticker} is not on the allowlist (${config.allowedMarkets.join(", ")})`
      : `"${input.requestedTicker}" is not a Stripr market`,
  };
}

export function evaluateGate(input: GateInput, config: GateConfig): Verdict {
  const market = checkMarket(input, config);
  const checks: Check[] = [market];
  // Without a market there is no price to judge, so the other rules are not evaluated.
  if (!market.passed) return { allowed: false, checks };

  // SG-01: the reference price must exist and be younger than the limit.
  const age = input.priceUpdatedAt === null ? null : Math.floor((input.nowMs - input.priceUpdatedAt) / 1000);
  const fresh = age !== null && age <= config.maxPriceAgeSeconds;
  checks.push({
    rule: "SG-01", code: "stale_price", passed: fresh,
    detail: age === null ? "no price timestamp available" : `price is ${age}s old (limit ${config.maxPriceAgeSeconds}s)`,
  });

  // SG-02: notional value must not exceed the cap.
  const notional = input.xstockUsd === null ? null : input.amount * input.xstockUsd;
  const underCap = notional !== null && notional <= config.maxNotionalUsd;
  checks.push({
    rule: "SG-02", code: "size_cap", passed: underCap,
    detail: notional === null ? "no price to value the position"
      : `notional $${notional.toFixed(2)} (cap $${config.maxNotionalUsd})`,
  });

  // SG-03: the xStock's on-chain price must stay within the caller's max deviation from the stock.
  const limit = input.maxSlippageBps ?? config.defaultMaxSlippageBps;
  const deviation = input.xstockUsd === null || input.stockUsd === null ? null
    : (Math.abs(input.xstockUsd - input.stockUsd) / input.stockUsd) * 10_000;
  const withinBand = deviation !== null && deviation <= limit;
  checks.push({
    rule: "SG-03", code: "slippage", passed: withinBand,
    detail: deviation === null ? "missing xStock or reference price"
      : `xStock trades ${deviation.toFixed(1)} bps from the stock (max ${limit} bps)`,
  });

  checks.sort((a, b) => a.rule.localeCompare(b.rule));
  return { allowed: checks.every((c) => c.passed), checks };
}
