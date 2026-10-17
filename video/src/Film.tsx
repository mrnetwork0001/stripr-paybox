import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { T, scene, wordAt } from "./timing";
import { C } from "./theme";
import { Captions } from "./ui/kit";
import { Grain } from "./ui/Grain";
import { clamp } from "./ui/motion";
import { Agent, Ask, Close, Confirm, Decline, Doge, Evidence, Gap, Gate, Hook, Idea, Open, PayBoxScene, Proof, Redeem, Retry, Turn, Unique } from "./scenes";

const SCENES: Record<string, React.FC> = {
  hook: Hook, paybox: PayBoxScene, retry: Retry, redeem: Redeem, open: Open, evidence: Evidence, gap: Gap, turn: Turn, idea: Idea, ask: Ask, decline: Decline, agent: Agent,
  confirm: Confirm, gate: Gate, doge: Doge, unique: Unique, proof: Proof, close: Close,
};
const OVERLAP = 10;

/** Each scene dissolves in over the last one, holding its own first frame while it does. */
const SceneIn: React.FC<{ S: React.FC; first: boolean }> = ({ S, first }) => {
  const f = useCurrentFrame();
  if (first) return <S />;
  const p = interpolate(f, [0, OVERLAP], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const body = f < OVERLAP ? <Freeze frame={0}><S /></Freeze> : <Sequence from={OVERLAP} layout="none"><S /></Sequence>;
  return <AbsoluteFill style={{ opacity: p, transform: `scale(${1.03 - 0.03 * p})`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined }}>{body}</AbsoluteFill>;
};

const LINES = T.scenes.flatMap((s) => s.lines.map((l) => [l.startFrame, l.words[l.words.length - 1]!.end] as const));
const DUCK: number[] = (() => {
  const v = new Array<number>(T.totalFrames + 1).fill(0);
  for (let f = 0; f <= T.totalFrames; f++) {
    let d = 0;
    for (const [a, b] of LINES) d = Math.max(d, interpolate(f, [a - 10, a, b, b + 14], [0, 1, 1, 0], clamp));
    v[f] = d;
  }
  return v;
})();
const musicVolume = (f: number) => {
  const end = T.totalFrames;
  return (0.55 - 0.37 * DUCK[Math.min(end, Math.max(0, f))]!) * interpolate(f, [0, 20], [0, 1], clamp) * interpolate(f, [end - 50, end], [1, 0], clamp);
};

interface Fx { file: string; at: number; vol: number }
function effects(): Fx[] {
  const sc = (id: string) => scene(id).from;
  const w = (id: string, word: string) => wordAt(id, word);
  return [
    { file: "tick", at: 2, vol: 0.35 },
    ...["Swap,", "send,", "sign."].map((x) => ({ file: "pop", at: w("hook", x) - 1, vol: 0.4 })),
    { file: "glitch", at: w("hook", "gone.") - 2, vol: 0.45 },
    { file: "whoosh", at: sc("paybox") - 6, vol: 0.3 },
    { file: "key", at: w("paybox", "keys.") - 4, vol: 0.4 },
    { file: "chime", at: w("paybox", "approve") - 2, vol: 0.3 },
    { file: "glitch", at: sc("open") + 3, vol: 0.4 },
    { file: "deny", at: w("open", "Refused.") - 2, vol: 0.45 },
    { file: "blip", at: w("open", "Thirty"), vol: 0.35 },
    { file: "stamp", at: w("open", "built.") + 4, vol: 0.6 },
    { file: "swoosh_up", at: sc("evidence") - 6, vol: 0.3 },
    { file: "blip", at: w("evidence", "fifteen"), vol: 0.4 },
    ...["Apple,", "Nvidia,", "Tesla,"].map((x) => ({ file: "pop", at: w("evidence", x) - 1, vol: 0.4 })),
    { file: "coin", at: w("evidence", "Coca-Cola's") + 8, vol: 0.4 },
    { file: "whoosh", at: sc("gap") - 6, vol: 0.3 },
    { file: "deny", at: w("gap", "cannot"), vol: 0.35 },
    { file: "riser", at: sc("turn") - 80, vol: 0.4 },
    { file: "impact", at: sc("turn") - 2, vol: 0.55 },
    { file: "whoosh", at: sc("idea") - 6, vol: 0.3 },
    { file: "split", at: w("idea", "splits") + 4, vol: 0.5 },
    { file: "pop", at: w("idea", "Principal") - 2, vol: 0.4 }, { file: "pop", at: w("idea", "Yield") - 2, vol: 0.4 },
    { file: "swoosh_up", at: sc("ask") - 6, vol: 0.3 },
    ...["finds", "reads", "previews"].map((x) => ({ file: "click", at: w("ask", x) - 2, vol: 0.35 })),
    { file: "whoosh", at: sc("decline") - 6, vol: 0.3 },
    { file: "deny", at: w("decline", "stops.") - 2, vol: 0.4 },
    { file: "whoosh", at: sc("agent") - 6, vol: 0.3 },
    { file: "whoosh", at: sc("retry") - 6, vol: 0.3 },
    { file: "deny", at: w("retry", "timed") - 2, vol: 0.35 },
    ...["unsigned", "approve.", "signs."].map((x) => ({ file: "click", at: w("agent", x) - 2, vol: 0.4 })),
    { file: "chime", at: w("agent", "signs.") + 4, vol: 0.35 },
    { file: "whoosh", at: sc("redeem") - 6, vol: 0.3 },
    { file: "chime", at: sc("redeem") + 240, vol: 0.35 },
    { file: "chime", at: w("confirm", "settle") - 2, vol: 0.35 },
    { file: "key", at: w("agent", "key.") - 4, vol: 0.45 },
    { file: "whoosh", at: sc("gate") - 6, vol: 0.3 },
    ...["Stale", "Size", "Depeg.", "Unknown"].map((x) => ({ file: "tick", at: w("gate", x) - 1, vol: 0.45 })),
    { file: "deny", at: w("gate", "refuses") - 2, vol: 0.45 },
    { file: "stamp", at: w("gate", "refuses") + 2, vol: 0.6 },
    { file: "whoosh", at: sc("doge") - 6, vol: 0.3 },
    { file: "deny", at: w("doge", "declines.") - 2, vol: 0.4 },
    { file: "swoosh_up", at: sc("unique") - 6, vol: 0.35 },
    ...["deterministic.", "non-custodial.", "runs"].map((x) => ({ file: "impact", at: w("unique", x) - 4, vol: 0.22 })),
    { file: "swoosh_up", at: sc("proof") - 6, vol: 0.3 },
    { file: "chime", at: w("proof", "split") - 2, vol: 0.35 }, { file: "chime", at: w("proof", "redeem,") - 2, vol: 0.35 },
    { file: "coin", at: w("proof", "Fifteen"), vol: 0.4 }, { file: "coin", at: w("proof", "Fees"), vol: 0.4 },
    { file: "whoosh", at: sc("close") - 6, vol: 0.3 },
    { file: "impact", at: w("close", "Agents") - 2, vol: 0.35 },
  ].filter((x) => x.at >= 0 && x.at < T.totalFrames);
}

export const Film: React.FC = () => {
  // Captions sit out where big type already carries the words.
  const hideCaptions = (f: number) => {
    const s = T.scenes.find((x) => f >= x.from && f < x.from + x.durationInFrames);
    return !s || ["hook", "paybox", "open", "gap", "turn", "unique", "close"].includes(s.id);
  };
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {T.scenes.map((s, i) => {
        const S = SCENES[s.id];
        const from = i === 0 ? s.from : s.from - OVERLAP;
        return S ? (
          <Sequence key={s.id} from={from} durationInFrames={s.durationInFrames + (i === 0 ? 0 : OVERLAP)} name={s.id}>
            <SceneIn S={S} first={i === 0} />
          </Sequence>
        ) : null;
      })}
      <Grain opacity={0.05} />
      <Captions hidden={hideCaptions} />
      <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} />
      {T.scenes.flatMap((s) => s.lines).map((l, i) => (
        <Sequence key={`vo${i}`} from={l.startFrame} durationInFrames={l.durationFrames} name={`vo ${l.text.slice(0, 16)}`}>
          <Audio src={staticFile(l.file)} />
        </Sequence>
      ))}
      {effects().map((x, i) => (
        <Sequence key={`fx${i}`} from={x.at} durationInFrames={120} name={`fx ${x.file}`}>
          <Audio src={staticFile(`audio/sfx/${x.file}.mp3`)} volume={x.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
