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

  // === PHASE 1: "ÇA VEUT DIRE QUOI..." — INSTANT (frame 0) ===
  const phase1Scale = interpolate(frame, [0, 4], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase1Opacity = interpolate(frame, [0, 2], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === PHASE 2: TERM SLAMS in (frame 4) — aggressive zoom 2.5→1 ===
  const termDelay = 4;
  const termSlam = spring({
    frame: frame - termDelay,
    fps,
    config: { damping: 5, stiffness: 150, mass: 0.8 },
  });
  const termScale = interpolate(termSlam, [0, 1], [2.5, 1]);
  const termOpacity = interpolate(frame, [termDelay, termDelay + 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // === Impact flash on term landing ===
  const impactFlash =
    frame >= termDelay && frame < termDelay + 5
      ? interpolate(frame, [termDelay, termDelay + 2, termDelay + 5], [0.8, 0.4, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  // === Screen shake on term slam ===
  const shakeIntensity =
    frame >= termDelay && frame < termDelay + 6
      ? (6 - (frame - termDelay)) / 6
      : 0;
  const shakeX = shakeIntensity * Math.sin(frame * 4) * 12;
  const shakeY = shakeIntensity * Math.cos(frame * 5) * 8;

  // === PHASE 3: Difficulty stars (frame 12) ===
  const diffDelay = 12;
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

  // === PHASE 4: "?" (frame 16) ===
  const qDelay = 16;
  const qScale = spring({
    frame: frame - qDelay,
    fps,
    config: { damping: 4, stiffness: 300, mass: 0.5 },
  });
  const qBounce = frame > qDelay ? Math.sin((frame - qDelay) * 0.15) * 10 : 0;

  // === PHASE 5: "Décodons les paroles" (frame 30) ===
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
          top: "25%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HL}35 0%, ${ACCENT}15 40%, transparent 60%)`,
          opacity: termOpacity * pulse,
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

      {/* === "ÇA VEUT DIRE QUOI..." — top zone === */}
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 40,
          left: SAFE.left,
          right: SAFE.right,
          transform: `scale(${phase1Scale})`,
          opacity: phase1Opacity,
        }}
      >
        <div
          style={{
            fontSize: 82,
            color: "#ffffff",
            fontFamily: FONT,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 4,
            textTransform: "uppercase",
            textShadow: `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${ACCENT}30`,
          }}
        >
          ÇA VEUT DIRE QUOI...
        </div>
      </div>

      {/* === THE TERM — positioned clearly below question === */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: SAFE.left,
          right: SAFE.right,
          transform: `scale(${termScale})`,
          opacity: termOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 150,
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

      {/* === Difficulty gauge — below term === */}
      {difficulty > 0 && diffConfig && (
        <div
          style={{
            position: "absolute",
            top: "54%",
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

      {/* === "?" — below difficulty === */}
      <div
        style={{
          position: "absolute",
          top: "68%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: qScale,
          transform: `scale(${qScale}) translateY(${qBounce}px)`,
        }}
      >
        <div
          style={{
            fontSize: 200,
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
