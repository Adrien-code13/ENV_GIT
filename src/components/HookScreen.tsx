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

export const HookScreen: React.FC<HookScreenProps> = ({ hook, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const HL = style.highlightColor;

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

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0a0a0a 0%, #1a0a2e 40%, #0a0a0a 100%)`,
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Radial glow behind term */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${HL}40 0%, transparent 60%)`,
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
            background: `radial-gradient(circle, ${HL}30 0%, transparent 70%)`,
            opacity: interpolate(frame, [termDelay, termDelay + 4], [0.8, 0], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}

      {/* === "AU FAIT..." === */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          transform: `scale(${phase1Scale})`,
          opacity: phase1Scale,
        }}
      >
        <div
          style={{
            fontSize: 64,
            color: "rgba(255,255,255,0.7)",
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
          top: "35%",
          transform: `scale(${phase2Scale}) translateY(${phase2Y}px)`,
          opacity: phase2Scale,
        }}
      >
        <div
          style={{
            fontSize: 80,
            color: "#ffffff",
            fontFamily: FONT,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 4,
            textTransform: "uppercase",
            textShadow: "0 4px 40px rgba(0,0,0,0.9)",
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
          marginTop: 80,
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

      {/* === Giant "?" bouncing === */}
      <div
        style={{
          position: "absolute",
          top: "62%",
          opacity: qScale,
          transform: `scale(${qScale}) translateY(${qBounce}px)`,
        }}
      >
        <div
          style={{
            fontSize: 220,
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
          bottom: "12%",
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
            fontSize: 36,
            color: "rgba(255,255,255,0.8)",
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
            width="50"
            height="50"
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
