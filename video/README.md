# Stripr on PayBox: demo film

A 2:49 film for the judges of the MoonPay PayBox Hackathon, Chapter 1. It shows the problem (AI agents
can now hold wallets), what Stripr does (splits a tokenized stock into a Principal Token and a Yield Token),
and what makes the PayBox plugin different (a deterministic gate that refuses unsafe trades and names the rule).

## What is real

**Numbers and on-screen data**

- **The cold-open refusal is the plugin's real output.** `split_position` was called for 100 AAPLx; the real text
  was `REFUSED by SG-02 size_cap: notional $34259.27 (cap $5000)`. The film voices that text with an ElevenLabs
  voice, labelled on screen as "real plugin output · voiced".
- **The two transactions are real**, on Solana mainnet, executed by Claude through the PayBox connector and
  approved by the wallet owner:
  - split `35KehCKyHih1CXjZ6grh7PA2Nd2tqqG5KZJxFcombrpdRkgzdw2xTn75u9gLJh3UBDoxwBFCqkbst7c6KFgrkWUm`
    (0.005 AAPLx in, 0.00499999 PT + YT out)
  - redeem `buwhHtQ7bURaswUqNALDNv9G9f7tuUsR1PM5oi3XEaBwtLkX7yyCfEezdw1T8bFX5ZeVg4G2XvnF6aAWjjkHM8t`
    (0.004 PT + YT burned, AAPLx returned)
- **5,600 lamports** is the fee both transactions paid on-chain, and what `preview_split` quoted
  (5,000 base plus 600 priority).
- **15 markets**: the Stripr mainnet markets, shown with the token art from the Stripr app, in the plugin's table, each checked on-chain
  (see `../src/markets.ts`).
- **KOx +2.26%**: the KOx market's on-chain multiplier, 1022560124624 / 1e12.
- **The four rules SG-01 to SG-04** and their codes are the gate in `../src/gate.ts`.

**Footage**

Every clip is the real Claude.ai session (the user's screen recording, `striprV.MOV`, 89.8 s), using the PayBox
connector and the Stripr plugin. All clips play in **real time**; held final frames extend a few clips to fit the
narration. The source times are:

| Scene | Source (s) | What happens |
|---|---|---|
| ask | 0–11 | positions read (0.01 AAPLx), preview of a 1 AAPLx split |
| decline | 12–17.8 | Claude declines "split 100 AAPLx": the wallet holds 0.01, and it notes SG-02 would refuse ~$34,000 anyway. This was the agent's own reasoning; the gate's refusal text is the one in the cold open. |
| retry | 18–30 | the first signing window expires ("operation has expired"); Claude declines to create a duplicate; a fresh request |
| approve | 35–47 | split approved in the PayBox signing window, "Transaction Confirmed" |
| redeem | 61.95–70.95 | redeem approved, "Transaction Confirmed" |
| confirmed | 50.5–53.5, 78–81, 82.6–84 | split and redeem confirmations with Explorer links, then the final position |
| DOGE | 84–89.8 | Claude declines DOGE: not a Stripr market |

**Brand marks**

- **Stripr:** the mark and wordmark artwork come from the Stripr repo (`demo/remotion/public/brand`). Fonts
  (Figtree, Fraunces) and colours come from the Stripr app.
- **PayBox:** the lockup is PayBox's own SVG from developer.paybox.sh.
- **Claude, ChatGPT, Grok, Gemini:** from the open LobeHub icon set (`@lobehub/icons-static-svg@1.95.1`).
  They are shown to name agents that can connect over MCP.
- **AAPLx token art:** from the Stripr app's `public/tokens`.

**Voices and audio** (all generated with ElevenLabs)

- **Narration:** Eric, with word timings from `/with-timestamps`.
- **The agent's line:** Sarah, with a light "system voice" treatment.
- **Score:** from the Music API.
- **Sound effects:** 15 clips from `/sound-generation`.

**Not real**

- The motion-graphic scenes are illustrations of real data, not UI.
- Stripr is unaudited, and the film says so.

## Build it

The ElevenLabs key is read at runtime from `/Users/mrnetwork/Syntura/video/.env`. It is never printed or copied here.

```bash
npm install
node scripts/voiceover.mjs     # narration, -16 LUFS per line, word timings
node scripts/music.mjs         # score
node scripts/timing.mjs        # src/timing.json: every word on a frame
node scripts/sfx.mjs           # sound effects
node scripts/stills.mjs 200 960 1720   # half-scale check stills
npm run draft                  # half-scale draft
npm run render                 # 1080p
node scripts/finish.mjs out/stripr-demo-1080p.mp4 out/stripr-demo.mp4   # -14 LUFS, TP <= -1 dBTP
```

Put the screen recording at `public/footage/agent.mp4` (gitignored).

## Chapters

0:00 AI agents can move money · 0:06 PayBox fixes half · 0:13 The other half: an agent that says no ·
0:27 Meet Stripr · 0:30 15 tokenized stocks · 0:45 The gap · 0:51 One stock, two tokens · 1:00 Live: ask ·
1:15 Live: decline · 1:23 Live: expired window, fresh request · 1:35 Live: split approved · 1:47 Live: redeem ·
1:56 Live: confirmed on chain · 2:04 The four-rule gate · 2:16 Live: DOGE declined · 2:23 What makes it different ·
2:34 On mainnet · 2:43 Stripr × PayBox

The final length is 2:49. Standard X accounts accept up to 2:20, so posting the full cut on X needs X Premium.
