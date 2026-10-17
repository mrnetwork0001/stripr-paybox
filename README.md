# stripr-paybox

A [PayBox](https://paybox.sh) marketplace plugin that lets an AI agent use
[Stripr](https://stripr.xyz) on Solana mainnet. Stripr splits a tokenized stock (an xStock) into a
**Principal Token (PT)**, which is the share itself, and a **Yield Token (YT)**, which is its dividend
stream. The agent can buy or sell a stock's dividends separately from the stock.

Before any trade, a **deterministic safety gate** runs plain rule checks. If one fails, the agent
declines and names the rule. No model sits in that path.

Built for the MoonPay PayBox Hackathon, Chapter 1.

## Tools

| Tool | Kind | What it does |
|---|---|---|
| `preview_split` | read-only | Shows what splitting `amount` of a ticker gives: equal PT and YT, the multiplier, price, price age, annualized yield and fees. |
| `get_positions` | read-only | Shows a wallet's xStock, PT and YT in every Stripr market, and how many PT + YT pairs it can redeem. |
| `split_position` | transaction | Runs the gate, then returns an **unsigned** `io.paybox/transactionProposal` for Stripr's `strip` instruction. |
| `redeem_position` | transaction | Returns an **unsigned** proposal for `redeem`: burns PT + YT and returns the xStock. |

The plugin never sees a private key. PayBox selects the wallet, asks the user to approve, then signs
and submits. Transactions use the placeholder blockhash, which PayBox replaces before simulating and
signing. The wallet is the only signer and the fee payer.

## The safety gate

[`src/gate.ts`](src/gate.ts) is a pure function. It takes the inputs, the current time and the config,
and returns a verdict. It does no I/O, so the same inputs always give the same verdict.

| Rule | Code | Refuses when |
|---|---|---|
| SG-01 | `stale_price` | The reference price is missing or older than `STRIPR_MAX_PRICE_AGE_SECONDS` (default 900). |
| SG-02 | `size_cap` | The notional value exceeds `STRIPR_MAX_NOTIONAL_USD` (default 5000). |
| SG-03 | `slippage` | The xStock's on-chain price deviates from the stock's reference price by more than `max_slippage_bps` (caller), or `STRIPR_DEFAULT_MAX_SLIPPAGE_BPS` (default 100). |
| SG-04 | `unknown_market` | The ticker is not a Stripr market, or not on `STRIPR_ALLOWED_MARKETS` (default: all 15). |

- **SG-04 is checked first and needs no network.** An unknown ticker is refused before any request is made.
- **A missing price fails closed.** Stripr's own frontend substitutes the current time when Jupiter gives no
  timestamp; this plugin refuses instead.
- **About SG-03:** a strip has no price impact, since PT and YT are minted 1:1 from the deposit. The rule
  instead guards against entering while the xStock is off its peg.
- **Exits are never blocked by risk limits.** `redeem_position` only refuses tickers that are not Stripr markets.

A refusal looks like this:

```
REFUSED by SG-02 size_cap: notional $34259.27 (cap $5000). No transaction was built.
pass SG-01 stale_price: price is 87s old (limit 900s)
FAIL SG-02 size_cap: notional $34259.27 (cap $5000)
pass SG-03 slippage: xStock trades 0.8 bps from the stock (max 100 bps)
pass SG-04 unknown_market: AAPLx is allowlisted
```

Separately from the gate, the transaction tools also check the wallet's balances. They refuse with a clear
message instead of handing PayBox a transaction that would fail.

## Where the numbers come from

Nothing here is invented. Every constant traces to the
[Stripr repo](https://github.com/NetLayerLabs/Stripr) at `0f5a303`, or to mainnet state.

- **Program** `9wpHmYvuq7qrAuH4VV3LyC54d2VyTYFMfveMMph2nzZF`: from `declare_id!` and the IDL.
- **Instruction layout**: `strip` and `redeem` codes, arguments and account order, from `app/src/idl/stripr.json`.
- **15 markets**: market accounts from Stripr's README, xStock mints from `app/src/config/deployment.json`,
  and PT/YT mints read from each market account. Every market was checked on mainnet: owner, discriminator,
  size, underlying mint, decimals (8) and token program (Token-2022). Each read re-checks the PT/YT mints.
- **Split maths**: `shares = floor(raw × multiplier / 1e12)`, the multiplier never moves down, and PT = YT = `shares`.
  This mirrors `Market::shares_for_raw` and the app's `StripForm`.
- **Yield**: in-force multiplier ^ (365 / days since launch) − 1, null under 30 days, as in the app's `api/prices/route.ts`.
- **Compute budget**: 600k unit limit and a 75th-percentile priority fee with a 1,000 µlamport floor, as in the app's `useStriprActions.ts`.
- **Fees**: Stripr charges no protocol fee. The only costs are network fees, plus rent the first time PT/YT token accounts are created.

## Network access

Register these exact hostnames in the PayBox portal. No secrets are needed.

- `api.mainnet-beta.solana.com`: market, mint and wallet accounts, and priority fees, in one batched request
- `lite-api.jup.ag`: xStock price, reference stock price, timestamp, multiplier history

Each request times out after 4 s. Module startup and tool discovery make no network calls.

## Verification so far

| Check | Result |
|---|---|
| `pnpm test` (type-check, two byte-identical builds, conformance) | passes, 4 tools |
| PayBox hosted checks | pass, 4 tools |
| `preview_split` and an SG-04 refusal in PayBox's hosted sandbox | succeeded, about 3.5 s including sandbox startup |
| `split_position`, PayBox **Validate transaction** (mainnet simulation) | **Simulation passed** |
| Claude via the PayBox connector: `get_positions` through `use_plugin` | live balances returned |
| **Real split** by an agent through PayBox, approved by the user | [`35KehCKy…`](https://explorer.solana.com/tx/35KehCKyHih1CXjZ6grh7PA2Nd2tqqG5KZJxFcombrpdRkgzdw2xTn75u9gLJh3UBDoxwBFCqkbst7c6KFgrkWUm): 0.005 AAPLx in, 0.00499999 PT + YT out, fee 5,600 lamports |
| **Real redeem** by an agent through PayBox, approved by the user | [`buwhHtQ7…`](https://explorer.solana.com/tx/buwhHtQ7bURaswUqNALDNv9G9f7tuUsR1PM5oi3XEaBwtLkX7yyCfEezdw1T8bFX5ZeVg4G2XvnF6aAWjjkHM8t): 0.004 PT + YT burned, AAPLx returned, fee 5,600 lamports |

The network fee matched `preview_split`'s estimate exactly: 5,000 base plus 600 priority lamports.

## Build

Requires Node.js 24.21.0 and pnpm 11.11.0 on macOS or Linux.

```bash
pnpm install --frozen-lockfile
pnpm test        # type-check, double build (must be byte-identical), MCP conformance
```

Upload only `dist/plugin.mjs`.

The build adds a `createRequire` banner because `@solana/web3.js` pulls in CommonJS dependencies.
The `bufferutil` and `utf-8-validate` native add-ons are deliberately left unbuilt; they are optional.

## Limits and caveats

- **Stripr is unaudited** and runs on mainnet with real funds. Liquidity is thin.
- Prices come from Jupiter's public API. If it is unreachable, `split_position` refuses under SG-01.
- YT locked in a Stripr position is not shown by `get_positions` and cannot be redeemed here. This plugin never locks YT.
- The public Solana RPC can rate-limit. `preview_split` falls back to Jupiter's multiplier if the RPC is down.

## Layout

```
src/plugin.ts       MCP server and the four tools
src/gate.ts         deterministic safety gate (SG-01 to SG-04)
src/stripr.ts       RPC and Jupiter reads, Stripr maths
src/transaction.ts  unsigned strip/redeem transactions
src/markets.ts      the 15 verified markets
src/paybox.ts       PayBox starter helpers (unchanged)
scripts/            PayBox starter test harness (unchanged)
```
