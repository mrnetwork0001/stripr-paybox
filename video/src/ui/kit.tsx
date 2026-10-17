import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import footage from "../footage.json";
import { T } from "../timing";
import { C, mono, sans, serif, SCENE_TONE, TONE, type Tone } from "../theme";
import { clamp, expo, soft } from "./motion";

/** Kinetic type: words rise and sharpen in turn; `accent` words take the italic serif in a colour. */
export const Words: React.FC<{ text: string; at: number; every?: number; accent?: Record<string, string>; style?: React.CSSProperties }> =
  ({ text, at, every = 3, accent = {}, style }) => {
    const f = useCurrentFrame();
    const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9$']/g, "");
    const acc = Object.fromEntries(Object.entries(accent).map(([k, v]) => [norm(k), v]));
    return (
      <span style={style}>
        {text.split(" ").map((w, i) => {
          const p = interpolate(f, [at + i * every, at + i * every + 14], [0, 1], { ...clamp, easing: expo });
          const a = acc[norm(w)];
          return (
            <span key={i} style={{
              display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 0.42}em)`, filter: `blur(${(1 - p) * 8}px)`, marginRight: "0.24em",
              ...(a ? { fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: a, fontSize: "1.1em" } : {}),
            }}>{w}</span>
          );
        })}
      </span>
    );
  };

const tc = (f: number) => {
  const s = Math.floor(f / 30);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(f % 30)}`;
};
export const sceneAt = (f: number) => T.scenes.find((s) => f >= s.from && f < s.from + s.durationInFrames) ?? T.scenes[T.scenes.length - 1]!;
export const toneOf = (id: string): Tone => TONE[SCENE_TONE[id] ?? "dark"]!;

/** Corner labels with the scene tag and a running timecode. */
export const Chrome: React.FC = () => {
  const f = useCurrentFrame();
  const sc = sceneAt(f);
  const tone = toneOf(sc.id);
  const base: React.CSSProperties = { position: "absolute", fontFamily: mono, fontSize: 15, letterSpacing: "0.04em", color: tone.muted };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...base, left: 48, top: 36 }}><span style={{ opacity: 0.85 }}>// stripr</span></div>
      <div style={{ ...base, right: 48, top: 36 }}>STRIPR_PAYBOX.MOV&nbsp;&nbsp;{tc(f)}</div>
      <div style={{ ...base, left: 48, bottom: 34, fontSize: 13 }}>moonpay paybox hackathon · chapter 1 · solana mainnet</div>
      <div style={{ ...base, right: 48, bottom: 34, fontSize: 13 }}>stripr.xyz</div>
    </AbsoluteFill>
  );
};

/** Narration captions on a frosted pill, each word lighting as it is spoken. */
export const Captions: React.FC<{ hidden: (f: number) => boolean }> = ({ hidden }) => {
  const f = useCurrentFrame();
  if (hidden(f)) return null;
  const line = T.scenes.flatMap((s) => s.lines).find((l) => f >= l.startFrame - 4 && f <= l.words[l.words.length - 1]!.end + 14);
  if (!line) return null;
  const tone = toneOf(sceneAt(f).id);
  const chunks: (typeof line.words)[] = [];
  let cur: typeof line.words = [];
  for (const w of line.words) {
    cur.push(w);
    if ((/[.,:;?]$/.test(w.word) && cur.length >= 4) || cur.length >= 9) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  let shown = chunks[0]!;
  for (const c of chunks) if (f >= c[0]!.start - 3) shown = c;
  const end = line.words[line.words.length - 1]!.end;
  const op = interpolate(f, [line.startFrame - 4, line.startFrame + 4, end + 6, end + 14], [0, 1, 1, 0], clamp);
  const light = tone.bg === TONE.light!.bg;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 84, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        maxWidth: 1300, textAlign: "center", fontFamily: sans, fontSize: 32, fontWeight: 500, lineHeight: 1.35, padding: "10px 26px", borderRadius: 18,
        background: light ? "rgba(255,255,255,0.8)" : "rgba(5,7,10,0.55)", backdropFilter: "blur(20px)",
      }}>
        {shown.map((w, i) => <span key={i} style={{ color: f >= w.start - 2 ? tone.ink : tone.muted, opacity: f >= w.start - 2 ? 1 : 0.55 }}>{w.word} </span>)}
      </div>
    </div>
  );
};

// Stripr's real brand art (Stripr/demo/remotion/public/brand): the ribbon mark and the wordmark lettering.
const MARK_RATIO = 491 / 353;
/**
 * The Stripr mark. `p` 0..1 wipes it on from the top; `spread` pulls the blue (top) and amber
 * (bottom) halves of the real mark apart, which is the split the product makes.
 */
export const Mark: React.FC<{ size: number; p?: number; spread?: number; style?: React.CSSProperties }> = ({ size, p = 1, spread = 0, style }) => {
  const h = size * MARK_RATIO;
  const img = (clip: string, dx: number, dy: number) => (
    <Img src={staticFile("brand/stripr-mark.png")} style={{
      position: "absolute", left: 0, top: 0, width: size, height: h, clipPath: clip, transform: `translate(${dx}px, ${dy}px)`,
    }} />
  );
  const reveal = `inset(0 0 ${(1 - p) * 100}% 0)`;
  return (
    <div style={{ position: "relative", width: size, height: h, clipPath: spread ? undefined : reveal, ...style }}>
      {spread
        ? <>{img("inset(0 0 50% 0)", -spread * 0.35, -spread)}{img("inset(50% 0 0 0)", spread * 0.35, spread)}</>
        : img("none", 0, 0)}
    </div>
  );
};

export const Wordmark: React.FC<{ size: number; p?: number }> = ({ size, p = 1 }) => {
  const w = interpolate(p, [0.45, 1], [0, 1], clamp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.16 }}>
      <Mark size={size * 0.62} p={interpolate(p, [0, 0.55], [0, 1], clamp)} />
      <Img src={staticFile("brand/stripr-word.png")} style={{
        height: size * 0.62 * MARK_RATIO * 0.86, width: "auto", opacity: w, transform: `translateX(${(1 - w) * -24}px)`, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`,
      }} />
    </div>
  );
};

/** A card that pops in at `at`. */
export const Card: React.FC<{ at: number; tone: Tone; style?: React.CSSProperties; children: React.ReactNode; accent?: string }> = ({ at, tone, style, children, accent }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 16], [0, 1], { ...clamp, easing: expo });
  return (
    <div style={{
      background: tone.card, border: `1px solid ${tone.line}`, borderRadius: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
      borderLeft: accent ? `6px solid ${accent}` : undefined, opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})`, ...style,
    }}>{children}</div>
  );
};

/** A rubber-stamp verdict. */
export const Stamp: React.FC<{ at: number; text: string; color?: string; style?: React.CSSProperties }> = ({ at, text, color = C.red, style }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 6], [0, 1], { ...clamp, easing: soft });
  return (
    <div style={{
      fontFamily: mono, fontWeight: 500, fontSize: 54, color, border: `5px solid ${color}`, borderRadius: 14, padding: "12px 30px", whiteSpace: "nowrap",
      opacity: p, transform: `scale(${1.6 - 0.6 * p}) rotate(-3deg)`, ...style,
    }}>{text}</div>
  );
};

export interface Clip { file: string; width: number; height: number; durationFrames: number }
const LIB = footage as unknown as Record<string, Clip>;

/** A rounded window playing a clip of the real product, with an address bar. */
export const Window: React.FC<{ name: string; url: string; width: number; left: number; top: number; startFrom?: number; enter?: number; zoom?: [number, number] }> =
  ({ name, url, width, left, top, startFrom = 0, enter = 0, zoom = [1, 1] }) => {
    const f = useCurrentFrame();
    const c = LIB[name];
    const bar = 44;
    const h = c ? (width * c.height) / c.width : (width * 9) / 16;
    const p = interpolate(f, [enter, enter + 18], [0, 1], { ...clamp, easing: soft });
    const z = interpolate(f, [enter, enter + 300], zoom, clamp);
    return (
      <div style={{
        position: "absolute", left, top, width, height: h + bar, borderRadius: 20, overflow: "hidden", background: C.ink900,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 40px 100px rgba(0,0,0,0.5)", opacity: p, transform: `translateY(${(1 - p) * 40}px)`,
      }}>
        <div style={{ height: bar, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: C.ink800 }}>
          {["#F26B5E", "#F5BE4F", "#5BC560"].map((col) => <span key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
          <div style={{ marginLeft: 16, flex: 1, height: 26, borderRadius: 13, background: C.ink700, display: "flex", alignItems: "center", padding: "0 14px", fontFamily: mono, fontSize: 14, color: "#9aa1ab" }}>{url}</div>
        </div>
        <div style={{ width, height: h, overflow: "hidden", position: "relative" }}>
          {c ? (
            <OffthreadVideo src={staticFile(c.file)} startFrom={startFrom} muted style={{ width, height: h, transform: `scale(${z})`, transformOrigin: "50% 40%" }} />
          ) : (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: mono, color: "#5b616b", fontSize: 24 }}>footage “{name}” pending</AbsoluteFill>
          )}
        </div>
      </div>
    );
  };

export const Token: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={staticFile("brand/AAPLx.png")} style={{ width: size, height: size, borderRadius: size / 2, ...style }} />
);
