import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { Hook, VideoStyle } from "../types";

interface HookScreenProps {
  hook: Hook;
  style: VideoStyle;
}

// Safe zones for TikTok / YouTube Shorts
const SAFE = { top: 150, bottom: 320, left: 80, right: 130 };

const DIFFICULTY_CONFIG: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "\uD83D\uDE0E", label: "EZ" },
  2: { emoji: "\uD83D\uDC40", label: "PAS ÉVIDENT" },
  3: { emoji: "\uD83E\uDD75", label: "C'EST CHAUD" },
  4: { emoji: "\uD83D\uDC80", label: "HARDCORE" },
};

export const HookScreen: React.FC<HookScreenProps> = ({ hook, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const HL = style.highlightColor;
  const ACCENT = "#38bdf8";
  const FONT = "'Impact', 'Arial Black', 'Bebas Neue', sans-serif";

  const difficulty = hook.difficulty ?? 0;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  // === PHASE 1: Lyric line with highlighted term — INSTANT (frame 0) ===
  const lineOpacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineY = interpolate(frame, [0, 4], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 2: Term highlight SLAMS (frame 3) ===
  const termDelay = 3;
  const termSlam = spring({
    frame: frame - termDelay,
    fps,
    config: { damping: 5, stiffness: 180, mass: 0.6 },
  });
  const termScale = interpolate(termSlam, [0, 1], [1.8, 1]);
  const termGlowOpacity = interpolate(frame, [termDelay, termDelay + 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === Impact flash on term highlight ===
  const impactFlash =
    frame >= termDelay && frame < termDelay + 4
      ? interpolate(frame, [termDelay, termDelay + 1, termDelay + 4], [0.7, 0.3, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  // === Screen shake ===
  const shakeIntensity =
    frame >= termDelay && frame < termDelay + 5
      ? (5 - (frame - termDelay)) / 5
      : 0;
  const shakeX = shakeIntensity * Math.sin(frame * 4) * 10;
  const shakeY = shakeIntensity * Math.cos(frame * 5) * 7;

  // === PHASE 3: "TU SAIS CE QUE ÇA VEUT DIRE ?" (frame 8) ===
  const questionDelay = 8;
  const questionSlam = spring({
    frame: frame - questionDelay,
    fps,
    config: { damping: 6, stiffness: 200, mass: 0.5 },
  });
  const questionOpacity = interpolate(frame, [questionDelay, questionDelay + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 4: Difficulty stars (frame 16) ===
  const diffDelay = 16;
  const diffScale = spring({
    frame: frame - diffDelay,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.4 },
  });
  const diffOpacity = interpolate(frame, [diffDelay, diffDelay + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const getStarScale = (starIndex: number) => {
    return spring({
      frame: frame - diffDelay - starIndex * 2,
      fps,
      config: { damping: 6, stiffness: 300, mass: 0.3 },
    });
  };

  // === PHASE 5: "DÉCODONS LES PAROLES" (frame 30) ===
  const decodonsDelay = 30;
  const decodonsOpacity = interpolate(
    frame,
    [decodonsDelay, decodonsDelay + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const decodonsY = interpolate(
    frame,
    [decodonsDelay, decodonsDelay + 8],
    [30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const arrowBounce = Math.sin(frame * 0.12) * 10;

  // Background effects
  const pulse = Math.sin(frame * 0.15) * 0.4 + 0.6;
  const gradientAngle = interpolate(frame, [0, 90], [135, 225]);

  // Split the hook line into parts: before term, term, after term
  const hookLine = hook.line;
  const hookTerm = hook.term;
  const termIndex = hookLine.toLowerCase().indexOf(hookTerm.toLowerCase());

  const beforeTerm = termIndex >= 0 ? hookLine.slice(0, termIndex) : hookLine;
  const termText = termIndex >= 0 ? hookLine.slice(termIndex, termIndex + hookTerm.length) : hookTerm;
  const afterTerm = termIndex >= 0 ? hookLine.slice(termIndex + hookTerm.length) : "";

  // Adaptive font size for the lyric line
  const lineLength = hookLine.length;
  let lineFontSize = 80;
  if (lineLength > 60) lineFontSize = 48;
  else if (lineLength > 45) lineFontSize = 56;
  else if (lineLength > 35) lineFontSize = 64;
  else if (lineLength > 25) lineFontSize = 72;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0b1120 0%, #0f1a30 30%, #131f3a 60%, #0b1120 100%)`,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HL}25 0%, transparent 70%)`,
          filter: "blur(80px)",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "-10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}20 0%, transparent 70%)`,
          filter: "blur(60px)",
          opacity: 0.7,
        }}
      />

      {/* Radial glow behind term */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HL}35 0%, ${ACCENT}15 40%, transparent 60%)`,
          opacity: termGlowOpacity * pulse,
          filter: "blur(80px)",
        }}
      />

      {/* === Impact flash === */}
      {impactFlash > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle, white 0%, ${HL}60 30%, transparent 60%)`,
            opacity: impactFlash,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}

      {/* === LYRIC CARD — looks like a music player lyric block === */}
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 20,
          left: SAFE.left - 10,
          right: SAFE.right - 10,
          opacity: lineOpacity,
          transform: `translateY(${lineY}px)`,
        }}
      >
        {/* Card container */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid rgba(255,255,255,0.12)`,
            borderLeft: `5px solid ${HL}`,
            borderRadius: 16,
            padding: "22px 24px 22px 28px",
            display: "flex",
            alignItems: "center",
            gap: 18,
            boxShadow: `0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Lyric text */}
          <div
            style={{
              flex: 1,
              fontSize: lineFontSize,
              fontWeight: 900,
              color: "rgba(255,255,255,0.92)",
              fontFamily: FONT,
              textTransform: "uppercase",
              lineHeight: 1.3,
              letterSpacing: 1,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            {beforeTerm}
            <span
              style={{
                color: "#000",
                background: HL,
                padding: "3px 14px",
                borderRadius: 7,
                marginLeft: 4,
                marginRight: 4,
                boxShadow: `0 0 ${30 + termGlowOpacity * 40}px ${HL}90, 0 0 60px ${HL}40`,
                display: "inline-block",
                transform: `scale(${termScale})`,
                textShadow: "none",
              }}
            >
              {termText}
            </span>
            {afterTerm}
          </div>

          {/* Sound wave bars — animated, signals "music playing" */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40, flexShrink: 0 }}>
            {[0.6, 1.0, 0.75, 0.9, 0.5, 0.85, 0.65].map((base, i) => {
              const barH = base * 20 + Math.sin(frame * 0.2 + i * 0.8) * base * 18;
              return (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: Math.max(4, barH),
                    borderRadius: 3,
                    background: `linear-gradient(180deg, ${HL}, ${HL}60)`,
                    boxShadow: `0 0 8px ${HL}60`,
                    alignSelf: "flex-end",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* === "TU SAIS CE QUE ÇA VEUT DIRE ?" === */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: SAFE.left,
          right: SAFE.right,
          textAlign: "center",
          opacity: questionOpacity,
          transform: `scale(${questionSlam})`,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: FONT,
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow: `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${ACCENT}30`,
            lineHeight: 1.15,
          }}
        >
          TU SAIS CE QUE
          <br />
          ÇA VEUT DIRE ?
        </div>
      </div>

      {/* === Difficulty gauge === */}
      {difficulty > 0 && diffConfig && (
        <div
          style={{
            position: "absolute",
            top: "62%",
            left: SAFE.left,
            right: SAFE.right,
            opacity: diffOpacity,
            transform: `scale(${diffScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: 4 }).map((_, i) => {
              const isFilled = i < difficulty;
              const starS = getStarScale(i);
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 58,
                    transform: `scale(${starS})`,
                    opacity: isFilled ? 1 : 0.2,
                    filter: isFilled
                      ? `drop-shadow(0 0 12px ${HL}80)`
                      : "none",
                  }}
                >
                  {"\u2B50"}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 6,
            }}
          >
            <div style={{ fontSize: 60 }}>{diffConfig.emoji}</div>
            <div
              style={{
                fontSize: 44,
                fontFamily: FONT,
                fontWeight: 900,
                color: HL,
                letterSpacing: 4,
                textTransform: "uppercase",
                textShadow: `0 0 20px ${HL}60`,
              }}
            >
              {diffConfig.label}
            </div>
          </div>
        </div>
      )}

      {/* === "DÉCODONS LES PAROLES" === */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE.bottom + 20,
          left: SAFE.left,
          right: SAFE.right,
          opacity: decodonsOpacity,
          transform: `translateY(${decodonsY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 48,
            color: "rgba(255,255,255,0.90)",
            fontFamily: FONT,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 5,
          }}
        >
          DÉCODONS LES PAROLES
        </div>
        <div
          style={{
            transform: `translateX(${arrowBounce}px)`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke={HL}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 12px ${HL}80)` }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
