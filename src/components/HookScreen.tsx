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

  // === Build the lyric line with the term censored ===
  const termIndex = hook.line.toLowerCase().indexOf(hook.term.toLowerCase());
  const hasTerm = termIndex !== -1;
  const beforeTerm = hasTerm ? hook.line.slice(0, termIndex) : "";
  const termText = hasTerm ? hook.line.slice(termIndex, termIndex + hook.term.length) : hook.term;
  const afterTerm = hasTerm ? hook.line.slice(termIndex + hook.term.length) : "";

  // === PHASE 1: Lyric line appears with censored term (frame 0-8) ===
  const lineScale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 250, mass: 0.4 },
  });

  // === PHASE 2: "TU SAIS CE QUE ÇA VEUT DIRE ?" (frame 10+) ===
  const questionDelay = 12;
  const questionScale = spring({
    frame: frame - questionDelay,
    fps,
    config: { damping: 6, stiffness: 200, mass: 0.5 },
  });
  const questionOpacity = interpolate(frame, [questionDelay, questionDelay + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 3: Difficulty gauge (frame 22+) ===
  const diffDelay = 22;
  const diffScale = spring({
    frame: frame - diffDelay,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.4 },
  });
  const diffOpacity = interpolate(frame, [diffDelay, diffDelay + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const getStarScale = (starIndex: number) => {
    return spring({
      frame: frame - diffDelay - starIndex * 3,
      fps,
      config: { damping: 6, stiffness: 300, mass: 0.3 },
    });
  };

  // === PHASE 4: "DÉCODONS" with arrow (frame 38+) ===
  const decodonsDelay = 38;
  const decodonsOpacity = interpolate(frame, [decodonsDelay, decodonsDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const decodonsY = interpolate(frame, [decodonsDelay, decodonsDelay + 10], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrowBounce = Math.sin(frame * 0.12) * 10;

  // === Background effects ===
  const pulse = Math.sin(frame * 0.15) * 0.4 + 0.6;
  const gradientAngle = interpolate(frame, [0, 90], [135, 225]);

  // Censored block glitch/pulse
  const censorPulse = Math.sin(frame * 0.2) * 0.15 + 0.85;
  const censorGlitch = frame % 30 < 2 ? (Math.random() - 0.5) * 4 : 0;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0b1120 0%, #0f1a30 30%, #131f3a 60%, #0b1120 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Ambient blobs */}
      <div style={{
        position: "absolute", top: "10%", left: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${HL}25 0%, transparent 70%)`,
        filter: "blur(80px)", opacity: 0.8,
      }} />
      <div style={{
        position: "absolute", bottom: "5%", right: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${ACCENT}20 0%, transparent 70%)`,
        filter: "blur(60px)", opacity: 0.7,
      }} />
      <div style={{
        position: "absolute", width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${HL}20 0%, transparent 60%)`,
        opacity: pulse, filter: "blur(80px)",
      }} />

      {/* === LYRIC LINE WITH CENSORED TERM === */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: 40, right: 40,
          transform: `scale(${lineScale})`,
          opacity: lineScale,
          textAlign: "center",
        }}
      >
        <div style={{
          fontSize: 52,
          fontFamily: FONT,
          fontWeight: 900,
          color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          lineHeight: 1.4,
          letterSpacing: 2,
        }}>
          {hasTerm ? (
            <>
              {beforeTerm}
              <span style={{
                display: "inline-block",
                position: "relative",
                background: `linear-gradient(135deg, ${HL}90, ${HL}60)`,
                color: "transparent",
                padding: "4px 16px",
                borderRadius: 8,
                margin: "0 6px",
                filter: `blur(${12 + censorGlitch}px)`,
                opacity: censorPulse,
                boxShadow: `0 0 30px ${HL}50`,
                minWidth: 80,
              }}>
                {termText}
              </span>
              {afterTerm}
            </>
          ) : hook.line}
        </div>
      </div>

      {/* === "TU SAIS CE QUE ÇA VEUT DIRE ?" === */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 30, right: 30,
          transform: `scale(${questionScale})`,
          opacity: questionOpacity,
          textAlign: "center",
        }}
      >
        <div style={{
          fontSize: 88,
          fontFamily: FONT,
          fontWeight: 900,
          color: "#ffffff",
          textTransform: "uppercase",
          letterSpacing: 3,
          lineHeight: 1.15,
          textShadow: `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${ACCENT}30`,
        }}>
          TU SAIS CE QUE
        </div>
        <div style={{
          fontSize: 88,
          fontFamily: FONT,
          fontWeight: 900,
          color: "#ffffff",
          textTransform: "uppercase",
          letterSpacing: 3,
          lineHeight: 1.15,
          textShadow: `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${ACCENT}30`,
        }}>
          ÇA VEUT DIRE
        </div>
        {/* Giant "?" */}
        <div style={{
          fontSize: 220,
          fontWeight: 900,
          color: HL,
          fontFamily: FONT,
          textShadow: `0 0 60px ${HL}80, 0 0 120px ${HL}40`,
          lineHeight: 1,
          marginTop: 10,
          transform: `translateY(${Math.sin(frame * 0.12) * 10}px)`,
        }}>
          ?
        </div>
      </div>

      {/* === Difficulty gauge === */}
      {difficulty > 0 && diffConfig && (
        <div
          style={{
            position: "absolute",
            top: "72%",
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
                    fontSize: 50,
                    transform: `scale(${starS})`,
                    opacity: isFilled ? 1 : 0.2,
                    filter: isFilled ? `drop-shadow(0 0 12px ${HL}80)` : "none",
                  }}
                >
                  {"\u2B50"}
                </div>
              );
            })}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginTop: 6,
          }}>
            <div style={{ fontSize: 52 }}>{diffConfig.emoji}</div>
            <div style={{
              fontSize: 36, fontFamily: FONT, fontWeight: 900,
              color: HL, letterSpacing: 4, textTransform: "uppercase",
              textShadow: `0 0 20px ${HL}60`,
            }}>
              {diffConfig.label}
            </div>
          </div>
        </div>
      )}

      {/* === "DÉCODONS LES PAROLES" with arrow === */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          opacity: decodonsOpacity,
          transform: `translateY(${decodonsY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          width: "100%",
        }}
      >
        <div style={{
          fontSize: 40, color: "rgba(255,255,255,0.85)",
          fontFamily: FONT, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: 5,
        }}>
          DÉCODONS LES PAROLES
        </div>
        <div style={{
          transform: `translateX(${arrowBounce}px)`,
          display: "flex", alignItems: "center",
        }}>
          <svg
            width="55" height="55" viewBox="0 0 24 24"
            fill="none" stroke={HL} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 12px ${HL}80)` }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
