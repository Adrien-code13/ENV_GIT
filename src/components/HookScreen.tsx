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
  const ACCENT = "#38bdf8"; // electric blue accent

  // === PHASE 1: "AU FAIT..." appears immediately with punch ===
  const phase1Scale = spring({
    frame,
    fps,
    config: { damping: 6, stiffness: 300, mass: 0.3 },
  });

  // === PHASE 2: "ÇA VEUT DIRE QUOI" slides in fast ===
  const phase2Scale = spring({
    frame: frame - 6,
    fps,
    config: { damping: 8, stiffness: 250, mass: 0.4 },
  });
  const phase2Y = interpolate(frame, [6, 16], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 3: TERM drops in with impact (delayed) ===
  const termDelay = 18;
  const termScale = spring({
    frame: frame - termDelay,
    fps,
    config: { damping: 5, stiffness: 180, mass: 0.7 },
  });
  const termOpacity = interpolate(frame, [termDelay, termDelay + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 3b: Difficulty gauge appears after term ===
  const diffDelay = termDelay + 8;
  const diffScale = spring({
    frame: frame - diffDelay,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.4 },
  });
  const diffOpacity = interpolate(frame, [diffDelay, diffDelay + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 4: "?" bounces in after term ===
  const qDelay = termDelay + 10;
  const qScale = spring({
    frame: frame - qDelay,
    fps,
    config: { damping: 4, stiffness: 300, mass: 0.5 },
  });
  const qBounce = frame > qDelay ? Math.sin((frame - qDelay) * 0.15) * 12 : 0;

  // === PHASE 5: "Décodons les paroles" with arrow ===
  const decodonsDelay = 45;
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

  // Shake effect on term landing
  const shakeX = frame >= termDelay && frame < termDelay + 6
    ? Math.sin(frame * 3) * (6 - (frame - termDelay)) * 2 : 0;
  const shakeY = frame >= termDelay && frame < termDelay + 6
    ? Math.cos(frame * 4) * (6 - (frame - termDelay)) * 1.5 : 0;

  const FONT = "'Impact', 'Arial Black', 'Bebas Neue', sans-serif";

  const difficulty = hook.difficulty ?? 0;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  // Star animation - each star pops in sequentially
  const getStarScale = (starIndex: number) => {
    return spring({
      frame: frame - diffDelay - starIndex * 3,
      fps,
      config: { damping: 6, stiffness: 300, mass: 0.3 },
    });
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0b1120 0%, #0f1a30 30%, #131f3a 60%, #0b1120 100%)`,
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Colored ambient blobs */}
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

      {/* Radial glow behind term */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HL}35 0%, ${ACCENT}15 40%, transparent 60%)`,
          opacity: termOpacity * pulse,
          filter: "blur(80px)",
        }}
      />

      {/* Impact flash when term appears */}
      {frame >= termDelay && frame < termDelay + 4 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle, ${HL}40 0%, ${ACCENT}20 40%, transparent 70%)`,
            opacity: interpolate(frame, [termDelay, termDelay + 4], [0.9, 0], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}

      {/* === "AU FAIT..." === */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          transform: `scale(${phase1Scale})`,
          opacity: phase1Scale,
        }}
      >
        <div
          style={{
            fontSize: 90,
            color: "rgba(255,255,255,0.8)",
            fontFamily: FONT,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          AU FAIT...
        </div>
      </div>

      {/* === "ÇA VEUT DIRE QUOI" === */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          transform: `scale(${phase2Scale}) translateY(${phase2Y}px)`,
          opacity: phase2Scale,
        }}
      >
        <div
          style={{
            fontSize: 100,
            color: "#ffffff",
            fontFamily: FONT,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 4,
            textTransform: "uppercase",
            textShadow: `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${ACCENT}30`,
          }}
        >
          ÇA VEUT DIRE QUOI
        </div>
      </div>

      {/* === THE TERM — big reveal === */}
      <div
        style={{
          transform: `scale(${termScale})`,
          opacity: termOpacity,
          textAlign: "center",
          marginTop: 60,
        }}
      >
        <div
          style={{
            fontSize: 170,
            fontWeight: 900,
            color: HL,
            fontFamily: FONT,
            textShadow: `0 0 60px ${HL}90, 0 0 120px ${HL}40, 0 8px 40px rgba(0,0,0,0.9)`,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          {hook.term}
        </div>
      </div>

      {/* === Difficulty gauge with stars === */}
      {difficulty > 0 && diffConfig && (
        <div
          style={{
            position: "absolute",
            top: "60%",
            opacity: diffOpacity,
            transform: `scale(${diffScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Stars row */}
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
          {/* Emoji + label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            marginTop: 6,
          }}>
            <div style={{ fontSize: 52 }}>{diffConfig.emoji}</div>
            <div style={{
              fontSize: 36,
              fontFamily: FONT,
              fontWeight: 900,
              color: HL,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: `0 0 20px ${HL}60`,
            }}>
              {diffConfig.label}
            </div>
          </div>
        </div>
      )}

      {/* === Giant "?" bouncing === */}
      <div
        style={{
          position: "absolute",
          top: "72%",
          opacity: qScale,
          transform: `scale(${qScale}) translateY(${qBounce}px)`,
        }}
      >
        <div
          style={{
            fontSize: 250,
            fontWeight: 900,
            color: HL,
            fontFamily: FONT,
            textShadow: `0 0 80px ${HL}80, 0 0 160px ${HL}40`,
            lineHeight: 0.8,
          }}
        >
          ?
        </div>
      </div>

      {/* === "Décodons les paroles" with arrow === */}
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
        <div
          style={{
            fontSize: 40,
            color: "rgba(255,255,255,0.85)",
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
            width="55"
            height="55"
            viewBox="0 0 24 24"
            fill="none"
            stroke={HL}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 12px ${HL}80)`,
            }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
