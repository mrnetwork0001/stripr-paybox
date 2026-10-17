import React from "react";
import { AbsoluteFill } from "remotion";
import { C, mono, sans, serif } from "./theme";
import { Wordmark } from "./ui/kit";

export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 36 }}>
    <Wordmark size={190} />
    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 70, color: "#fff", letterSpacing: "-0.03em" }}>
      Agents that know when to <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: C.amber }}>say no.</span>
    </div>
    <div style={{ fontFamily: mono, fontSize: 26, color: "#7c828c" }}>Stripr × PayBox · tokenized-stock yield stripping on Solana</div>
  </AbsoluteFill>
);
