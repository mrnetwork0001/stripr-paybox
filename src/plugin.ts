import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { checkMarket, DEFAULT_CONFIG, evaluateGate, loadConfig, type Verdict } from "./gate.js";
import { atomicAmount, proposeSolana, solanaOutputSchema } from "./paybox.js";
import { findMarket, MARKETS } from "./markets.js";
import {
  effectiveMultiplier, formatMultiplier, formatUnits, MIN_PRIORITY_MICROLAMPORTS, MULTIPLIER_ONE,
  ata, networkFeeLamports, rawForShares, readOnChain, readPositions, readQuote, sharesForRaw, type OnChain,
} from "./stripr.js";
import { PublicKey } from "@solana/web3.js";
import { buildRedeemTransaction, buildStripTransaction, parseWallet } from "./transaction.js";

const PROTOCOL_VERSION = "2026-07-28";
const TICKERS = MARKETS.map((m) => m.ticker).join(", ");

const ticker = z.string().min(1).max(16).describe(`xStock ticker, e.g. AAPLx. Supported: ${TICKERS}.`);
const amount = z.string().regex(/^(0|[1-9][0-9]{0,15})(\.[0-9]{1,12})?$/)
  .describe("xStock amount as shown in the wallet, as a decimal string, e.g. \"1.5\".");

const previewOutput = z.object({
  ticker: z.string(),
  market: z.string(),
  deposit: z.object({ amount: z.string(), raw: z.string() }).strict(),
  receive: z.object({ pt: z.string(), yt: z.string() }).strict(),
  multiplier: z.string(),
  price: z.object({
    xstock_usd: z.number().nullable(),
    stock_usd: z.number().nullable(),
    updated_at: z.string().nullable(),
    age_seconds: z.number().int().nullable(),
  }).strict(),
  value_usd: z.number().nullable(),
  annualized_yield: z.number().nullable(),
  fees: z.object({ protocol_bps: z.number().int(), network_lamports: z.number().int() }).strict(),
  warnings: z.array(z.string()),
}).strict();

function refuse(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true };
}

function refusal(verdict: Verdict) {
  const failed = verdict.checks.filter((c) => !c.passed);
  const lines = verdict.checks.map((c) => `${c.passed ? "pass" : "FAIL"} ${c.rule} ${c.code}: ${c.detail}`);
  return refuse(
    `REFUSED by ${failed.map((c) => `${c.rule} ${c.code}`).join(", ")}: ${failed[0]?.detail}. No transaction was built.\n` +
    lines.join("\n"),
  );
}

/** Raw balance of one token account in the wallet; undefined if the account does not exist. */
const holding = (chain: OnChain, account: PublicKey) => chain.holdings?.find((h) => h.address === account.toBase58())?.amount;

const sender = z.string().min(32).max(44).describe("Public address of the PayBox wallet that will sign and pay fees.");

const positionsOutput = z.object({
  wallet: z.string(),
  positions: z.array(z.object({
    ticker: z.string(),
    market: z.string(),
    xstock: z.string(),
    pt: z.string(),
    yt: z.string(),
    redeemable: z.string(),
  }).strict()),
}).strict();

const reason = (result: PromiseSettledResult<unknown>) =>
  result.status === "rejected" ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : "";

function createServer() {
  const server = new McpServer(
    { name: "stripr-paybox", version: "0.2.0" },
    { supportedProtocolVersions: [PROTOCOL_VERSION] },
  );

  server.registerTool(
    "preview_split",
    {
      title: "Preview a Stripr split",
      description:
        "Read-only. Shows what splitting an xStock on Stripr (Solana mainnet) would give: equal amounts of " +
        "Principal Token (PT, the share itself) and Yield Token (YT, its dividend stream), plus price, " +
        "annualized yield and fees. Nothing is signed or sent.",
      inputSchema: z.object({ ticker, amount }).strict(),
      outputSchema: previewOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args) => {
      const market = findMarket(args.ticker);
      if (!market) return refuse(`Unknown ticker "${args.ticker}". Supported: ${TICKERS}.`);

      const nowMs = Date.now();
      const [chain, quote] = await Promise.allSettled([readOnChain(market, Math.floor(nowMs / 1000)), readQuote(market, nowMs)]);
      const warnings: string[] = [];

      let multiplier: bigint;
      let decimals: number;
      let priority = MIN_PRIORITY_MICROLAMPORTS;
      if (chain.status === "fulfilled") {
        multiplier = effectiveMultiplier(chain.value);
        decimals = chain.value.decimals;
        priority = chain.value.priorityMicroLamports;
      } else if (quote.status === "fulfilled" && quote.value.decimals !== null && quote.value.multiplier !== null) {
        multiplier = BigInt(Math.trunc(quote.value.multiplier * Number(MULTIPLIER_ONE)));
        decimals = quote.value.decimals;
        warnings.push(`Solana RPC unavailable (${reason(chain)}); amounts use Jupiter's multiplier and may be off by one unit.`);
      } else {
        return refuse(`Could not read Stripr market data: RPC ${reason(chain)}; Jupiter ${reason(quote) || "returned no multiplier"}.`);
      }
      if (quote.status === "rejected") warnings.push(`Price unavailable (${reason(quote)}).`);

      let typed: bigint;
      try {
        typed = BigInt(atomicAmount(args.amount, decimals));
      } catch {
        return refuse(`Amount "${args.amount}" has more than ${decimals} decimal places.`);
      }
      // app/src/components/app/forms.tsx StripForm: typed share units -> raw tokens -> minted shares.
      const raw = rawForShares(typed, multiplier);
      const shares = sharesForRaw(raw, multiplier);
      if (raw === 0n || shares === 0n) return refuse(`Amount "${args.amount}" is too small to split.`);

      const q = quote.status === "fulfilled" ? quote.value : null;
      const display = formatUnits(shares, decimals);
      const valueUsd = q?.xstockUsd != null ? Math.round(Number(display) * q.xstockUsd * 100) / 100 : null;
      const structured = {
        ticker: market.ticker,
        market: market.market,
        deposit: { amount: display, raw: raw.toString() },
        receive: { pt: display, yt: display },
        multiplier: formatMultiplier(multiplier),
        price: {
          xstock_usd: q?.xstockUsd ?? null,
          stock_usd: q?.stockUsd ?? null,
          updated_at: q?.updatedAt != null ? new Date(q.updatedAt).toISOString() : null,
          age_seconds: q?.updatedAt != null ? Math.max(0, Math.floor((nowMs - q.updatedAt) / 1000)) : null,
        },
        value_usd: valueUsd,
        annualized_yield: q?.annualizedYield ?? null,
        fees: { protocol_bps: 0, network_lamports: networkFeeLamports(priority) },
        warnings: [...warnings, "Stripr charges no protocol fee. If the wallet has no PT/YT token accounts yet, the program creates them and the wallet pays their rent."],
      };
      const yieldText = structured.annualized_yield === null ? "n/a" : `${(structured.annualized_yield * 100).toFixed(2)}%`;
      return {
        content: [{
          type: "text" as const,
          text: `Splitting ${display} ${market.ticker}${valueUsd === null ? "" : ` (~$${valueUsd})`} gives ${display} PT + ${display} YT. ` +
            `Annualized yield ${yieldText}. Protocol fee 0; network fee ~${structured.fees.network_lamports} lamports.`,
        }],
        structuredContent: structured,
      };
    },
  );

  server.registerTool(
    "split_position",
    {
      title: "Split an xStock into PT + YT",
      description:
        "Prepares an UNSIGNED Solana transaction that deposits an xStock into Stripr and mints equal PT and YT " +
        "to the wallet. PayBox validates it, asks the user to approve, then signs and submits; nothing is signed here. " +
        "Before building, a deterministic safety gate refuses and names the rule if any check fails: " +
        "SG-01 stale_price (reference price too old), SG-02 size_cap (notional above the cap), " +
        "SG-03 slippage (xStock price deviates from the stock by more than max_slippage_bps), " +
        "SG-04 unknown_market (ticker not on the allowlist).",
      inputSchema: z.object({
        ticker,
        amount,
        sender,
        max_slippage_bps: z.number().int().min(0).max(10_000).optional()
          .describe("Max allowed deviation of the xStock price from the stock price, in basis points. Defaults to the configured value."),
      }).strict(),
      outputSchema: solanaOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (args) => {
      let config;
      try {
        config = loadConfig(process.env);
      } catch (error) {
        return refuse(`Plugin configuration error: ${(error as Error).message}.`);
      }
      const market = findMarket(args.ticker);
      const nowMs = Date.now();
      const base = { ticker: market?.ticker, requestedTicker: args.ticker, nowMs, maxSlippageBps: args.max_slippage_bps };

      // SG-04 needs no network: refuse unknown markets before any request.
      if (!market) {
        return refusal(evaluateGate({ ...base, priceUpdatedAt: null, xstockUsd: null, stockUsd: null, amount: 0 }, config));
      }
      const user = parseWallet(args.sender);
      if (!user) return refuse(`"${args.sender}" is not a valid Solana wallet address.`);

      const [chain, quote] = await Promise.allSettled([
        readOnChain(market, Math.floor(nowMs / 1000), args.sender),
        readQuote(market, nowMs),
      ]);
      if (chain.status === "rejected") return refuse(`Could not read the ${market.ticker} market from Solana (${reason(chain)}). No transaction was built.`);

      const multiplier = effectiveMultiplier(chain.value);
      let typed: bigint;
      try {
        typed = BigInt(atomicAmount(args.amount, chain.value.decimals));
      } catch {
        return refuse(`Amount "${args.amount}" has more than ${chain.value.decimals} decimal places.`);
      }
      const raw = rawForShares(typed, multiplier);
      const shares = sharesForRaw(raw, multiplier);
      if (raw === 0n || shares === 0n) return refuse(`Amount "${args.amount}" is too small to split.`);
      const display = formatUnits(shares, chain.value.decimals);

      const q = quote.status === "fulfilled" ? quote.value : null;
      const verdict = evaluateGate({
        ...base, priceUpdatedAt: q?.updatedAt ?? null, xstockUsd: q?.xstockUsd ?? null, stockUsd: q?.stockUsd ?? null, amount: Number(display),
      }, config);
      if (!verdict.allowed) return refusal(verdict);

      const held = holding(chain.value, ata(user, new PublicKey(market.mint), new PublicKey(chain.value.tokenProgram)));
      if (held === undefined || held < raw) {
        const shown = formatUnits(sharesForRaw(held ?? 0n, multiplier), chain.value.decimals);
        return refuse(`Wallet ${args.sender} holds ${shown} ${market.ticker}, less than the ${display} requested. No transaction was built.`);
      }

      const result = proposeSolana({ transactionBase64: buildStripTransaction(market, chain.value, user, raw) });
      return {
        ...result,
        content: [
          ...result.content,
          {
            type: "text" as const,
            text: `Deposit ${display} ${market.ticker} (raw ${raw}) into Stripr market ${market.market}; receive ${display} PT + ${display} YT.\n` +
              verdict.checks.map((c) => `pass ${c.rule} ${c.code}: ${c.detail}`).join("\n"),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_positions",
    {
      title: "Show Stripr positions",
      description:
        "Read-only. Lists a wallet's xStock, PT and YT balances in every Stripr market where it holds something, " +
        "and how many PT + YT pairs it can redeem back into the xStock.",
      inputSchema: z.object({ wallet: z.string().min(32).max(44).describe("Public Solana address to inspect.") }).strict(),
      outputSchema: positionsOutput,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args) => {
      if (!parseWallet(args.wallet)) return refuse(`"${args.wallet}" is not a valid Solana wallet address.`);
      let rows;
      try {
        rows = await readPositions(MARKETS, args.wallet);
      } catch (error) {
        return refuse(`Could not read positions from Solana (${(error as Error).message}).`);
      }
      // All 15 xStocks and their PT/YT mints use 8 decimals (checked on mainnet).
      const fmt = (raw: bigint) => formatUnits(raw, 8);
      const positions = rows.filter((r) => r.xstock > 0n || r.pt > 0n || r.yt > 0n).map((r) => ({
        ticker: r.market.ticker,
        market: r.market.market,
        // Wallets display scaled xStock balances, so show the same number.
        xstock: fmt(sharesForRaw(r.xstock, r.multiplier)),
        pt: fmt(r.pt),
        yt: fmt(r.yt),
        redeemable: fmt(r.pt < r.yt ? r.pt : r.yt),
      }));
      const text = positions.length === 0
        ? `Wallet ${args.wallet} holds no xStock, PT or YT in any Stripr market.`
        : positions.map((p) => `${p.ticker}: ${p.xstock} xStock, ${p.pt} PT, ${p.yt} YT (redeemable ${p.redeemable})`).join("\n");
      return { content: [{ type: "text" as const, text }], structuredContent: { wallet: args.wallet, positions } };
    },
  );

  server.registerTool(
    "redeem_position",
    {
      title: "Redeem PT + YT back into the xStock",
      description:
        "Prepares an UNSIGNED Solana transaction that burns equal amounts of PT and YT and returns the xStock " +
        "from the Stripr vault. PayBox validates it, asks the user to approve, then signs and submits. " +
        "Exits are never blocked by the gate's risk limits; only tickers that are not Stripr markets are refused (SG-04).",
      inputSchema: z.object({
        ticker,
        amount: z.string().regex(/^(0|[1-9][0-9]{0,15})(\.[0-9]{1,12})?$/)
          .describe("Number of PT + YT pairs to redeem, as a decimal string, e.g. \"0.005\"."),
        sender,
      }).strict(),
      outputSchema: solanaOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (args) => {
      const market = findMarket(args.ticker);
      // Known-market check only: the allowlist and risk limits guard entries, never exits.
      const check = checkMarket({ ticker: market?.ticker, requestedTicker: args.ticker }, DEFAULT_CONFIG);
      if (!market || !check.passed) return refusal({ allowed: false, checks: [check] });
      const user = parseWallet(args.sender);
      if (!user) return refuse(`"${args.sender}" is not a valid Solana wallet address.`);

      let chain: OnChain;
      try {
        chain = await readOnChain(market, Math.floor(Date.now() / 1000), args.sender);
      } catch (error) {
        return refuse(`Could not read the ${market.ticker} market from Solana (${(error as Error).message}). No transaction was built.`);
      }
      let shares: bigint;
      try {
        shares = BigInt(atomicAmount(args.amount, chain.decimals));
      } catch {
        return refuse(`Amount "${args.amount}" has more than ${chain.decimals} decimal places.`);
      }
      const multiplier = effectiveMultiplier(chain);
      const raw = rawForShares(shares, multiplier);
      if (shares === 0n || raw === 0n) return refuse(`Amount "${args.amount}" is too small to redeem.`);

      const tokenProgram = new PublicKey(chain.tokenProgram);
      const pt = holding(chain, ata(user, new PublicKey(chain.ptMint), tokenProgram)) ?? 0n;
      const yt = holding(chain, ata(user, new PublicKey(chain.ytMint), tokenProgram)) ?? 0n;
      const pairs = pt < yt ? pt : yt;
      if (pairs < shares) {
        return refuse(`Wallet ${args.sender} holds ${formatUnits(pt, chain.decimals)} PT and ${formatUnits(yt, chain.decimals)} YT for ${market.ticker}, ` +
          `so it can redeem at most ${formatUnits(pairs, chain.decimals)}. No transaction was built.`);
      }
      // redeem does not create the xStock account (it is not init_if_needed in the program).
      if (holding(chain, ata(user, new PublicKey(market.mint), tokenProgram)) === undefined) {
        return refuse(`Wallet ${args.sender} has no ${market.ticker} token account to receive the redemption. No transaction was built.`);
      }

      const display = formatUnits(shares, chain.decimals);
      const receive = formatUnits(sharesForRaw(raw, multiplier), chain.decimals);
      const result = proposeSolana({ transactionBase64: buildRedeemTransaction(market, chain, user, shares) });
      return {
        ...result,
        content: [
          ...result.content,
          { type: "text" as const, text: `Burn ${display} PT + ${display} YT in Stripr market ${market.market}; receive ${receive} ${market.ticker} (raw ${raw}).\n${check.rule} ${check.code}: ${market.ticker} is a Stripr market` },
        ],
      };
    },
  );

  return server;
}

serveStdio(createServer, { legacy: "reject" });
