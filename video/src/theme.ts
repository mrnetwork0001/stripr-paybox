import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Stripr's own fonts (app/src/app/layout.tsx: Figtree + Fraunces) and colours
// (app/tailwind.config.ts ink scale; the ribbon's blue and amber from public/stripr-header.png).
export const sans = loadFigtree("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const serif = loadFraunces("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;
loadFraunces("italic", { weights: ["400", "500"], subsets: ["latin"] });
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const C = {
  ink: "#05070a",
  ink900: "#0a0e13",
  ink800: "#131922",
  ink700: "#1b232e",
  paper: "#F2F0EA",
  blue: "#2F6FE4",
  amber: "#E8A33D",
  twist: "#1f2428",
  red: "#EF5350",
  green: "#34d399",
  white: "#ffffff",
};

export type Tone = { bg: string; ink: string; muted: string; card: string; line: string };
export const TONE: Record<string, Tone> = {
  dark: { bg: C.ink, ink: "#F4F4F5", muted: "#7c828c", card: C.ink900, line: C.ink700 },
  light: { bg: C.paper, ink: "#0a0e13", muted: "#6b6f76", card: "#ffffff", line: "#dcd8ce" },
  blue: { bg: C.blue, ink: "#ffffff", muted: "rgba(255,255,255,0.72)", card: "rgba(255,255,255,0.12)", line: "rgba(255,255,255,0.3)" },
};

export const SCENE_TONE: Record<string, keyof typeof TONE> = {
  hook: "light", paybox: "dark", retry: "dark", redeem: "dark", open: "dark", problem: "light", evidence: "dark", gap: "light", turn: "blue", idea: "dark", ask: "dark", decline: "dark", agent: "dark",
  confirm: "dark", gate: "dark", doge: "dark", unique: "blue", proof: "light", close: "dark",
};
export const SCENE_LABEL: Record<string, string> = {
  open: "00 / cold open", problem: "01 / the problem", turn: "02 / stripr", idea: "03 / the split",
  agent: "04 / through paybox", gate: "05 / the gate", proof: "06 / on mainnet", close: "07 / stripr × paybox",
};
