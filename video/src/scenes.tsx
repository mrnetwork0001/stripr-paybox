import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { scene, wordAt, lineStart } from "./timing";
import { C, mono, sans, serif, TONE } from "./theme";
import { Card, Mark, Stamp, Token, Window, Words, Wordmark } from "./ui/kit";
import { Count } from "./ui/Count";
import { clamp, expo, ramp } from "./ui/motion";

/** Frame of `word` relative to the start of scene `id`. */
const at = (id: string, word: string, nth = 0) => wordAt(id, word, nth) - scene(id).from;
const lineAt = (id: string, i: number) => lineStart(id, i) - scene(id).from;
const dark = TONE.dark!, light = TONE.light!, blue = TONE.blue!;

const Bg: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => (
  <AbsoluteFill style={{ background: color }}>{children}</AbsoluteFill>
);
const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", ...style }}>{children}</AbsoluteFill>
);
const Big: React.FC<{ children: React.ReactNode; color: string; size?: number; style?: React.CSSProperties }> = ({ children, color, size = 104, style }) => (
  <div style={{ fontFamily: sans, fontWeight: 600, fontSize: size, color, letterSpacing: "-0.035em", lineHeight: 1.04, textAlign: "center", maxWidth: 1500, ...style }}>{children}</div>
);
const Eyebrow: React.FC<{ children: React.ReactNode; color: string; o?: number }> = ({ children, color, o = 1 }) => (
  <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: "0.18em", textTransform: "uppercase", color, opacity: o }}>{children}</div>
);

const Logo: React.FC<{ file: string; size: number; style?: React.CSSProperties }> = ({ file, size, style }) => (
  <Img src={staticFile(`brand/${file}`)} style={{ height: size, width: "auto", ...style }} />
);
const AGENTS: [string, string][] = [["claude-color.svg", "Claude"], ["openai.svg", "ChatGPT"], ["grok.svg", "Grok"], ["gemini-color.svg", "Gemini"]];

/** 00. The agent's real refusal, read out, then the line that frames it. */
export const Open: React.FC = () => {
  const f = useCurrentFrame();
  const l1 = lineAt("open", 1);
  const out = interpolate(f, [l1 - 14, l1], [1, 0], clamp);
  return (
    <Bg color={C.ink}>
      <AbsoluteFill style={{ opacity: out }}>
        <Center style={{ gap: 34 }}>
          <Eyebrow color={dark.muted} o={ramp(f, 2, 14)}>agent reply · real plugin output · voiced</Eyebrow>
          <Card at={4} tone={dark} accent={C.red} style={{ padding: "34px 44px", width: 1180 }}>
            <div style={{ fontFamily: mono, fontSize: 22, color: dark.muted, marginBottom: 14 }}>stripr · split_position · 100 AAPLx</div>
            <div style={{ fontFamily: mono, fontSize: 40, color: dark.ink, lineHeight: 1.35 }}>
              <span style={{ color: C.red }}>REFUSED</span> by SG-02 size_cap
            </div>
            <div style={{ fontFamily: mono, fontSize: 30, color: dark.ink, marginTop: 18, opacity: ramp(f, at("open", "Thirty") - 4, at("open", "Thirty") + 10) }}>
              notional <Count to={34259.27} at={at("open", "Thirty")} dur={40} decimals={2} prefix="$" style={{ color: C.red }} /> &gt; cap $5,000
            </div>
            <div style={{ fontFamily: mono, fontSize: 26, color: dark.muted, marginTop: 14, opacity: ramp(f, at("open", "transaction") - 6, at("open", "transaction") + 8) }}>
              No transaction was built.
            </div>
          </Card>
          <Stamp at={at("open", "built.") + 4} text="NO TRANSACTION" />
        </Center>
      </AbsoluteFill>
      <Center>
        <Big color={dark.ink} size={112}>
          <Words text="The other half?" at={l1} every={4} accent={{ "half?": C.amber }} />
        </Big>
        <div style={{ marginTop: 26, fontFamily: serif, fontStyle: "italic", fontSize: 66, color: dark.ink, opacity: ramp(f, at("open", "An") - 2, at("open", "An") + 12) }}>
          An agent that knows when to say <span style={{ color: C.red }}>no.</span>
        </div>
      </Center>
    </Bg>
  );
};

/** 01. Agents hold wallets now. */
export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const q = at("problem", "So");
  const chip = (word: string, label: string, i: number) => {
    const t = at("problem", word);
    const p = interpolate(f, [t, t + 14], [0, 1], { ...clamp, easing: expo });
    return (
      <div key={label} style={{
        fontFamily: mono, fontSize: 34, padding: "16px 30px", borderRadius: 999, background: "#fff", border: `1px solid ${light.line}`, color: light.ink,
        opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
      }}>{["◎", "✎", "↗"][i]} {label}</div>
    );
  };
  return (
    <Bg color={C.paper}>
      <Center style={{ gap: 46 }}>
        <div style={{ display: "flex", gap: 30, opacity: interpolate(f, [q - 10, q], [1, 0.25], clamp) }}>
          {AGENTS.map(([file, name], i) => {
            const p = interpolate(f, [2 + i * 5, 16 + i * 5], [0, 1], { ...clamp, easing: expo });
            return (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 28px", borderRadius: 22, background: "#fff", border: `1px solid ${light.line}`,
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
              }}>
                <Logo file={file} size={52} />
                <span style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: light.ink }}>{name}</span>
              </div>
            );
          })}
        </div>
        <Big color={light.ink} style={{ opacity: interpolate(f, [q - 10, q], [1, 0.25], clamp) }}>
          <Words text="Agents can hold wallets now." at={2} every={4} accent={{ wallets: C.blue }} />
        </Big>
        <div style={{ display: "flex", gap: 22 }}>
          {chip("hold", "hold", 0)}{chip("sign,", "sign", 1)}{chip("spend.", "spend", 2)}
        </div>
        <Big color={light.ink} size={88}>
          <Words text="So who tells them when to stop?" at={q} every={4} accent={{ "stop?": C.red }} />
        </Big>
      </Center>
    </Bg>
  );
};

/** 02. The turn: the ribbon draws on in full-bleed blue. */
export const Turn: React.FC = () => {
  const f = useCurrentFrame();
  const p = ramp(f, 0, 30);
  return (
    <Bg color={C.blue}>
      <Center style={{ gap: 30 }}>
        <div style={{ transform: `scale(${0.92 + 0.08 * p})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 34, background: C.ink, padding: "40px 64px", borderRadius: 40, boxShadow: "0 40px 120px rgba(0,0,0,0.35)" }}>
            <Wordmark size={170} p={p} />
          </div>
        </div>
        <div style={{ fontFamily: sans, fontSize: 40, color: blue.ink, opacity: ramp(f, 34, 50), letterSpacing: "-0.01em" }}>
          Split the stock. <span style={{ fontFamily: serif, fontStyle: "italic" }}>Keep the dividends.</span>
        </div>
      </Center>
    </Bg>
  );
};

/** 03. One token, two strands: PT is the share, YT is its dividends. */
export const Idea: React.FC = () => {
  const f = useCurrentFrame();
  const split = interpolate(f, [at("idea", "splits") + 4, at("idea", "splits") + 28], [0, 1], { ...clamp, easing: expo });
  const pt = at("idea", "Principal"), yt = at("idea", "Yield");
  const keep = at("idea", "Keep");
  return (
    <Bg color={C.ink}>
      <Center>
        <div style={{ position: "relative", width: 1600, height: 640 }}>
          <div style={{ position: "absolute", left: 800, top: 300, transform: `translate(-50%, -50%) scale(${1 - 0.35 * split})`, opacity: interpolate(split, [0, 0.6], [1, 0], clamp) }}>
            <Token size={220} />
            <div style={{ textAlign: "center", fontFamily: mono, fontSize: 26, color: dark.muted, marginTop: 14 }}>AAPLx · tokenized stock</div>
          </div>
          <div style={{ position: "absolute", left: 800, top: 300, transform: "translate(-50%, -50%)", opacity: split }}>
            <Mark size={190} spread={split * 46} />
          </div>
          {[{ t: pt, x: 40, color: C.blue, k: "PT", name: "Principal Token", what: "the share", line: "Keep one." },
            { t: yt, x: 1060, color: C.amber, k: "YT", name: "Yield Token", what: "its dividends", line: "Trade the other." }].map((c, i) => (
            <Card key={c.k} at={c.t - 2} tone={dark} accent={c.color} style={{ position: "absolute", left: c.x, top: 170, width: 500, padding: "34px 38px" }}>
              <div style={{ fontFamily: serif, fontSize: 92, color: c.color, lineHeight: 1 }}>{c.k}</div>
              <div style={{ fontFamily: sans, fontSize: 38, fontWeight: 600, color: dark.ink, marginTop: 14 }}>{c.name}</div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 36, color: dark.muted, marginTop: 6 }}>{c.what}</div>
              <div style={{ fontFamily: mono, fontSize: 24, color: c.color, marginTop: 22, opacity: ramp(f, keep + i * 22, keep + i * 22 + 12) }}>{c.line}</div>
            </Card>
          ))}
        </div>
      </Center>
    </Bg>
  );
};

/** 04. The real agent run through PayBox, with what happens at each step. */
export const Agent: React.FC = () => {
  const f = useCurrentFrame();
  const steps: [string, string, string][] = [
    ["through.", "fresh request: split 0.005 AAPLx", C.blue],
    ["unsigned", "builds an unsigned transaction", C.blue],
    ["approve.", "you approve", C.green],
    ["signs.", "PayBox signs", C.green],
    ["key.", "plugin never touches a key", C.amber],
  ];
  return (
    <Bg color={C.ink}>
      <Window name="agent" url="claude.ai · PayBox connector · Stripr plugin" width={1150} left={90} top={170} enter={0} zoom={[1, 1.04]} />
      {(() => {
        // Honest speed labels for the cut: source 30-39.6s at 1.5x, 39.6-42s real time, 67.2-70.95s at ~1.2x.
        const tag = "split · real time";
        return (
          <div style={{ position: "absolute", left: 90, top: 124, fontFamily: mono, fontSize: 20, letterSpacing: "0.08em", color: dark.muted,
            padding: "6px 14px", borderRadius: 10, background: dark.card, border: `1px solid ${dark.line}`, opacity: ramp(f, 8, 20) }}>
            ● REC {tag}
          </div>
        );
      })()}
      <div style={{ position: "absolute", left: 1310, top: 190, width: 540, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 10, opacity: ramp(f, 2, 16) }}>
          <Logo file="claude-color.svg" size={54} />
          <span style={{ fontFamily: mono, fontSize: 30, color: dark.muted }}>→</span>
          <Logo file="paybox-lockup-white.svg" size={40} />
          <span style={{ fontFamily: mono, fontSize: 30, color: dark.muted }}>→</span>
          <Mark size={40} />
        </div>
        <Eyebrow color={dark.muted} o={ramp(f, 6, 18)}>live run · solana mainnet</Eyebrow>
        {steps.map(([word, label, color], i) => {
          const t = at("agent", word);
          const p = interpolate(f, [t - 2, t + 12], [0, 1], { ...clamp, easing: expo });
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", borderRadius: 18, background: dark.card, border: `1px solid ${dark.line}`,
              opacity: p, transform: `translateX(${(1 - p) * 40}px)`,
            }}>
              <span style={{ fontFamily: mono, fontSize: 22, color, width: 34 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: sans, fontSize: 32, fontWeight: 500, color: dark.ink }}>{label}</span>
            </div>
          );
        })}
      </div>
    </Bg>
  );
};

/** 05. The ribbon runs through four gates; SG-02 closes on it. */
export const Gate: React.FC = () => {
  const f = useCurrentFrame();
  const rules: [string, string, string, string][] = [
    ["SG-01", "stale_price", "Stale", "price too old"],
    ["SG-02", "size_cap", "Size", "over the cap"],
    ["SG-03", "slippage", "Depeg.", "xStock off its peg"],
    ["SG-04", "unknown_market", "Unknown", "not allowlisted"],
  ];
  const trip = at("gate", "refuses");
  const tripped = f >= trip;
  const flow = ramp(f, 4, at("gate", "Unknown") + 20);
  return (
    <Bg color={C.ink}>
      <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center" }}>
        <Big color={dark.ink} size={76}><Words text="Four plain rules. Before every trade." at={2} every={3} accent={{ plain: C.amber }} /></Big>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={120} y1={500} x2={120 + 1680 * (tripped ? Math.min(flow, 0.42) : flow)} y2={500} stroke={C.blue} strokeWidth={14} strokeLinecap="round" />
      </svg>
      {rules.map(([id, code, word, desc], i) => {
        const t = at("gate", word);
        const p = interpolate(f, [t - 2, t + 12], [0, 1], { ...clamp, easing: expo });
        const bad = tripped && id === "SG-02";
        const col = bad ? C.red : f >= t ? C.green : dark.line;
        const x = 250 + i * 400;
        return (
          <div key={id} style={{ position: "absolute", left: x, top: 270, width: 300, textAlign: "center", opacity: 0.35 + 0.65 * p }}>
            <div style={{ fontFamily: mono, fontSize: 28, color: dark.muted }}>{id}</div>
            <div style={{ margin: "18px auto", width: 18, height: 230, borderRadius: 9, background: col, boxShadow: f >= t ? `0 0 40px ${col}` : "none" }} />
            <div style={{ fontFamily: mono, fontSize: 30, color: bad ? C.red : dark.ink }}>{code}</div>
            <div style={{ fontFamily: sans, fontSize: 26, color: dark.muted, marginTop: 8 }}>{desc}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 700, width: "100%", display: "flex", justifyContent: "center" }}>
        <Stamp at={trip + 2} text="REFUSED · SG-02 size_cap" />
      </div>
      <div style={{ position: "absolute", top: 820, width: "100%", textAlign: "center", fontFamily: serif, fontStyle: "italic", fontSize: 50, color: dark.ink, opacity: ramp(f, at("gate", "No") - 2, at("gate", "No") + 12) }}>
        No model in the path.
      </div>
    </Bg>
  );
};

/** 06. Real transactions, real numbers. */
export const Proof: React.FC = () => {
  const f = useCurrentFrame();
  const tx: [string, string, string, string][] = [
    ["split", "Split", "35KehCKy…6KFgrkWUm", "0.005 AAPLx → 0.00499999 PT + YT"],
    ["redeem,", "Redeem", "buwhHtQ7…AWjjkHM8t", "0.004 PT + YT → AAPLx back"],
  ];
  const fifteen = at("proof", "Fifteen"), fees = at("proof", "Fees");
  return (
    <Bg color={C.paper}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center" }}>
        <Big color={light.ink} size={84}><Words text="And it is live." at={2} every={4} accent={{ "live.": C.blue }} /></Big>
      </div>
      <div style={{ position: "absolute", top: 300, left: 160, width: 1600, display: "flex", gap: 40 }}>
        {tx.map(([w, k, sig, what]) => (
          <Card key={k} at={at("proof", w) - 4} tone={light} accent={C.green} style={{ flex: 1, padding: "32px 36px" }}>
            <div style={{ fontFamily: mono, fontSize: 22, color: C.green }}>✓ confirmed · solana mainnet</div>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 52, color: light.ink, marginTop: 10 }}>{k}</div>
            <div style={{ fontFamily: mono, fontSize: 26, color: light.muted, marginTop: 8 }}>{sig}</div>
            <div style={{ fontFamily: sans, fontSize: 28, color: light.ink, marginTop: 16 }}>{what}</div>
          </Card>
        ))}
      </div>
      <div style={{ position: "absolute", top: 690, left: 160, width: 1600, display: "flex", gap: 40 }}>
        <Card at={fifteen - 4} tone={light} style={{ flex: 1, padding: "26px 36px", display: "flex", alignItems: "baseline", gap: 22 }}>
          <Count to={15} at={fifteen} dur={24} style={{ fontFamily: serif, fontSize: 110, color: C.blue, lineHeight: 1 }} />
          <span style={{ fontFamily: sans, fontSize: 34, color: light.ink }}>xStock markets, checked on-chain</span>
        </Card>
        <Card at={fees - 4} tone={light} style={{ flex: 1, padding: "26px 36px", display: "flex", alignItems: "baseline", gap: 22 }}>
          <Count to={5600} at={fees} dur={24} style={{ fontFamily: serif, fontSize: 110, color: C.amber, lineHeight: 1 }} />
          <span style={{ fontFamily: sans, fontSize: 34, color: light.ink }}>lamports paid. <span style={{ color: light.muted }}>5,600 quoted.</span></span>
        </Card>
      </div>
    </Bg>
  );
};

/** 07. Close. */
export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const p = ramp(f, 0, 30);
  return (
    <Bg color={C.ink}>
      <Center style={{ gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Wordmark size={150} p={p} />
          <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: ramp(f, at("close", "PayBox.") - 4, at("close", "PayBox.") + 8) }}>
            <span style={{ fontFamily: serif, fontSize: 90, color: dark.muted }}>×</span>
            <Logo file="paybox-lockup-white.svg" size={92} />
          </div>
        </div>
        <Big color={dark.ink} size={72}>
          <Words text="Agents that know when to say no." at={at("close", "Agents")} every={3} accent={{ "no.": C.amber }} />
        </Big>
        <div style={{ fontFamily: mono, fontSize: 24, color: dark.muted, opacity: ramp(f, at("close", "no.") + 10, at("close", "no.") + 26), textAlign: "center", lineHeight: 1.7 }}>
          stripr.xyz · MoonPay PayBox Hackathon, Chapter 1<br />Stripr is unaudited. Real transactions on Solana mainnet.
        </div>
      </Center>
    </Bg>
  );
};

/** A scene of real footage: the clip in a window, notes that land on spoken words, honest speed tags. */
const Live: React.FC<{ id: string; clip: string; eyebrow: string; notes: [string, string, string][]; tags: [number, string][] }> = ({ id, clip, eyebrow, notes, tags }) => {
  const f = useCurrentFrame();
  const tag = (tags.find(([until]) => f < until) ?? tags[tags.length - 1]!)[1];
  return (
    <Bg color={C.ink}>
      <div style={{ position: "absolute", left: 90, top: 124, fontFamily: mono, fontSize: 20, letterSpacing: "0.08em", color: dark.muted,
        padding: "6px 14px", borderRadius: 10, background: dark.card, border: `1px solid ${dark.line}`, opacity: ramp(f, 8, 20) }}>● REC {tag}</div>
      <Window name={clip} url="claude.ai · PayBox connector · Stripr plugin" width={1150} left={90} top={170} enter={0} zoom={[1, 1.04]} />
      <div style={{ position: "absolute", left: 1310, top: 190, width: 540, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 10, opacity: ramp(f, 2, 16) }}>
          <Logo file="claude-color.svg" size={54} />
          <span style={{ fontFamily: mono, fontSize: 30, color: dark.muted }}>→</span>
          <Logo file="paybox-lockup-white.svg" size={40} />
          <span style={{ fontFamily: mono, fontSize: 30, color: dark.muted }}>→</span>
          <Mark size={40} />
        </div>
        <Eyebrow color={dark.muted} o={ramp(f, 6, 18)}>{eyebrow}</Eyebrow>
        {notes.map(([word, label, color], i) => {
          const t = at(id, word);
          const p = interpolate(f, [t - 2, t + 12], [0, 1], { ...clamp, easing: expo });
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", borderRadius: 18, background: dark.card,
              border: `1px solid ${dark.line}`, borderLeft: `5px solid ${color}`, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <span style={{ fontFamily: sans, fontSize: 30, fontWeight: 500, color: dark.ink }}>{label}</span>
            </div>
          );
        })}
      </div>
    </Bg>
  );
};

export const Ask: React.FC = () => (
  <Live id="ask" clip="ask" eyebrow="live session · real wallet"
    notes={[["finds", "finds the Stripr plugin", C.blue], ["reads", "reads the wallet: 0.01 AAPLx", C.blue], ["previews", "previews a 1 AAPLx split", C.blue], ["yield,", "0.24% yield · no protocol fee", C.amber], ["fees,", "~5,600 lamports network fee", C.amber]]}
    tags={[[9999, "real time"]]} />
);
export const Decline: React.FC = () => (
  <Live id="decline" clip="decline" eyebrow="live session · asked for 100 AAPLx"
    notes={[["stops.", "declined", C.red], ["little,", "wallet holds 0.01 AAPLx", C.red], ["cap", "~$34,000: SG-02 cap would refuse", C.red], ["Nothing", "no transaction built", C.red]]}
    tags={[[9999, "real time"]]} />
);
export const Confirm: React.FC = () => (
  <Live id="confirm" clip="confirm" eyebrow="live session · confirmed on chain"
    notes={[["settle", "split confirmed 19:44", C.green], ["position,", "redeem confirmed 19:46", C.green], ["Explorer", "Solana Explorer links", C.green]]}
    tags={[[90, "split · real time"], [180, "redeem · real time"], [9999, "positions · real time"]]} />
);
export const Doge: React.FC = () => (
  <Live id="doge" clip="doge" eyebrow="live session · asked for 1 DOGE"
    notes={[["declines.", "declined", C.red], ["list", "not a Stripr market", C.red]]}
    tags={[[9999, "real time"]]} />
);

const TOKENS = ["AAPLx", "NVDAx", "TSLAx", "MSFTx", "GOOGLx", "AMZNx", "METAx", "SPYx", "QQQx", "COINx", "MSTRx", "KOx", "PGx", "JNJx", "MCDx"];

/** Evidence: 15 live markets; dividends grow the token (KOx multiplier read on-chain). */
export const Evidence: React.FC = () => {
  const f = useCurrentFrame();
  const fifteen = at("evidence", "fifteen"), grow = at("evidence", "growing"), ko = at("evidence", "Coca-Cola's");
  const spot: Record<string, number> = { AAPLx: at("evidence", "Apple,"), NVDAx: at("evidence", "Nvidia,"), TSLAx: at("evidence", "Tesla,") };
  return (
    <Bg color={C.ink}>
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        <Big color={dark.ink} size={76}>
          <Count to={15} at={fifteen} dur={20} style={{ fontFamily: serif, color: C.blue }} /> <Words text="tokenized stocks, live on Solana." at={fifteen + 4} every={3} />
        </Big>
      </div>
      <div style={{ position: "absolute", top: 290, left: 260, width: 1400, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 30, justifyItems: "center" }}>
        {TOKENS.map((t, i) => {
          const a = spot[t] ?? fifteen + 8 + i * 2;
          const p = interpolate(f, [a, a + 12], [0, 1], { ...clamp, easing: expo });
          const lit = spot[t] !== undefined && f >= spot[t]!;
          return (
            <div key={t} style={{ textAlign: "center", opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
              <Img src={staticFile(`brand/${t}.png`)} style={{ width: 110, height: 110, borderRadius: 55, boxShadow: lit ? `0 0 0 4px ${C.blue}` : "none" }} />
              <div style={{ fontFamily: mono, fontSize: 22, color: lit ? dark.ink : dark.muted, marginTop: 10 }}>{t}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 860, width: "100%", display: "flex", justifyContent: "center", gap: 30 }}>
        <Card at={grow - 2} tone={dark} style={{ padding: "18px 30px", fontFamily: sans, fontSize: 32, color: dark.ink }}>dividends grow the token itself</Card>
        <Card at={ko - 2} tone={dark} accent={C.amber} style={{ padding: "18px 30px", fontFamily: sans, fontSize: 32, color: dark.ink, display: "flex", alignItems: "center", gap: 16 }}>
          <Img src={staticFile("brand/KOx.png")} style={{ width: 44, height: 44, borderRadius: 22 }} /> KOx
          <Count to={2.26} at={ko + 10} dur={30} decimals={2} prefix="+" suffix="%" style={{ fontFamily: serif, fontSize: 44, color: C.amber }} />
          <span style={{ fontFamily: mono, fontSize: 20, color: dark.muted }}>on-chain multiplier 1.0226</span>
        </Card>
      </div>
    </Bg>
  );
};

/** Gap: the share and its dividends are welded together. */
export const Gap: React.FC = () => {
  const f = useCurrentFrame();
  const cannot = at("gap", "cannot");
  const shake = f >= cannot && f < cannot + 18 ? Math.sin(f * 2.2) * 10 * (1 - (f - cannot) / 18) : 0;
  return (
    <Bg color={C.paper}>
      <Center style={{ gap: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, transform: `translateX(${shake}px)` }}>
          {[["the share", C.blue], ["its dividends", C.amber]].map(([label, color], i) => (
            <div key={label} style={{ padding: "34px 54px", background: color, color: "#fff", fontFamily: sans, fontWeight: 600, fontSize: 52,
              borderRadius: i === 0 ? "28px 0 0 28px" : "0 28px 28px 0", opacity: ramp(f, 2 + i * 6, 16 + i * 6) }}>{label}</div>
          ))}
        </div>
        <div style={{ fontFamily: mono, fontSize: 34, color: C.red, opacity: ramp(f, cannot, cannot + 10) }}>🔒 sold together · held together</div>
        <Big color={light.ink} size={80}><Words text="You cannot keep one and sell the other." at={cannot - 2} every={3} accent={{ "other.": C.red }} /></Big>
      </Center>
    </Bg>
  );
};

/** Unique: three claims, each with its proof. */
export const Unique: React.FC = () => {
  const f = useCurrentFrame();
  const claims: [string, string, string, string][] = [
    ["deterministic.", "Deterministic", "Same inputs, same verdict.", "src/gate.ts · pure function · no model"],
    ["non-custodial.", "Non-custodial", "PayBox signs, never the plugin.", "unsigned io.paybox/transactionProposal"],
    ["runs", "On mainnet today", "Real split. Real redeem.", "35KehCKy… · buwhHtQ7…"],
  ];
  return (
    <Bg color={C.blue}>
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center" }}>
        <Big color={blue.ink} size={84}><Words text="What makes it different?" at={2} every={4} accent={{ "different?": "#ffffff" }} /></Big>
      </div>
      <div style={{ position: "absolute", top: 330, left: 140, width: 1640, display: "flex", gap: 36 }}>
        {claims.map(([w, title, line, proof], i) => (
          <Card key={title} at={at("unique", w) - 4} tone={{ ...dark, card: C.ink }} style={{ flex: 1, padding: "40px 38px", minHeight: 420 }}>
            <div style={{ fontFamily: mono, fontSize: 24, color: [C.blue, C.amber, C.green][i] }}>0{i + 1}</div>
            <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 64, color: "#fff", marginTop: 18, lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontFamily: sans, fontSize: 32, color: "#e4e4e7", marginTop: 22 }}>{line}</div>
            <div style={{ fontFamily: mono, fontSize: 21, color: dark.muted, marginTop: 34, borderTop: `1px solid ${dark.line}`, paddingTop: 18 }}>proof · {proof}</div>
          </Card>
        ))}
      </div>
    </Bg>
  );
};

/** Hook: the problem. Agents can move money now. */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const gone = at("hook", "One");
  const verbs: [string, string][] = [["Swap,", "swap"], ["send,", "send"], ["sign.", "sign"]];
  return (
    <Bg color={C.paper}>
      <Center style={{ gap: 40 }}>
        <div style={{ display: "flex", gap: 26, opacity: interpolate(f, [gone - 8, gone], [1, 0.3], clamp) }}>
          {AGENTS.map(([file, name], i) => {
            const p = interpolate(f, [i * 4, 14 + i * 4], [0, 1], { ...clamp, easing: expo });
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderRadius: 20, background: "#fff",
                border: `1px solid ${light.line}`, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                <Logo file={file} size={46} /><span style={{ fontFamily: sans, fontSize: 30, fontWeight: 600, color: light.ink }}>{name}</span>
              </div>
            );
          })}
        </div>
        <Big color={light.ink} size={110} style={{ opacity: interpolate(f, [gone - 8, gone], [1, 0.3], clamp) }}>
          <Words text="AI agents can move money now." at={6} every={4} accent={{ "money": C.blue }} />
        </Big>
        <div style={{ display: "flex", gap: 22 }}>
          {verbs.map(([w, label]) => {
            const t = at("hook", w);
            const p = interpolate(f, [t - 2, t + 10], [0, 1], { ...clamp, easing: expo });
            return <div key={label} style={{ fontFamily: mono, fontSize: 36, padding: "12px 28px", borderRadius: 999, background: light.ink, color: "#fff", opacity: p, transform: `scale(${0.8 + 0.2 * p})` }}>{label}</div>;
          })}
        </div>
        <Big color={light.ink} size={92}><Words text="One wrong call, and it is gone." at={gone} every={3} accent={{ "gone.": C.red }} /></Big>
      </Center>
    </Bg>
  );
};

/** PayBox: half of the answer. A wallet, never the keys, every move approved. */
export const PayBoxScene: React.FC = () => {
  const f = useCurrentFrame();
  const pts: [string, string, string][] = [["wallet,", "a wallet for the agent", "◎"], ["keys.", "never the keys", "⚿"], ["approve", "you approve every move", "✓"]];
  return (
    <Bg color={C.ink}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, rgba(124,92,255,0.22), transparent 55%)" }} />
      <Center style={{ gap: 44 }}>
        <div style={{ opacity: ramp(f, 0, 14), transform: `scale(${0.9 + 0.1 * ramp(f, 0, 18)})` }}><Logo file="paybox-lockup-white.svg" size={110} /></div>
        <Big color={dark.ink} size={70}><Words text="fixes half of that." at={at("paybox", "fixes")} every={3} accent={{ "half": "#a78bfa" }} /></Big>
        <div style={{ display: "flex", gap: 26 }}>
          {pts.map(([w, label, icon]) => (
            <Card key={label} at={at("paybox", w) - 2} tone={dark} style={{ padding: "26px 34px", display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: 40, color: "#a78bfa" }}>{icon}</span>
              <span style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: dark.ink }}>{label}</span>
            </Card>
          ))}
        </div>
      </Center>
    </Bg>
  );
};

export const Retry: React.FC = () => (
  <Live id="retry" clip="retry" eyebrow="live session · real hiccup"
    notes={[["timed", "first window expired unsigned", C.amber], ["duplicate.", "no duplicate created", C.green], ["fresh", "fresh request", C.blue]]}
    tags={[[9999, "real time"]]} />
);
export const Redeem: React.FC = () => (
  <Live id="redeem" clip="redeem" eyebrow="live session · redeem 0.004"
    notes={[["redeem,", "burn 0.004 PT + YT", C.blue], ["approval.", "approved in PayBox", C.green], ["flow.", "AAPLx returns to the wallet", C.green]]}
    tags={[[9999, "real time"]]} />
);
