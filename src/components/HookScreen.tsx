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

  // Pulsing glow animation
  const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;

  // Term scale-in with spring
  const termScale = spring({
    frame: frame - 8,
    fps,
    config: { damping: 8, stiffness: 120, mass: 0.6 },
  });

  // Question intro scale
  const questionScale = spring({
    frame: frame - 2,
    fps,
    config: { damping: 6, stiffness: 200, mass: 0.4 },
  });

  // "Décodons les paroles" appears later
  const decodonsOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const decodonsX = interpolate(frame, [35, 50], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arrow bounce
  const arrowBounce = Math.sin(frame * 0.12) * 8;

  // Question mark bounce (for the term)
  const questionMarkBounce = Math.sin(frame * 0.1) * 10;

  // Background gradient rotation
  const gradientAngle = interpolate(frame, [0, 90], [135, 225]);

  const FONT_IMPACT = "'Impact', 'Arial Black', 'Bebas Neue', sans-serif";
  const FONT_UI = "'Inter', 'Helvetica Neue', sans-serif";

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #0a0a0a 0%, #1a0a2e 40%, #0a0a0a 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated radial glow behind term */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${style.highlightColor}50 0%, transparent 70%)`,
          opacity: pulse,
          filter: "blur(60px)",
        }}
      />

      {/* "Tu sais ce que veut dire..." - MUCH BIGGER */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          opacity: questionScale,
          transform: `scale(${questionScale})`,
        }}
      >
        <div
          style={{
            fontSize: 72,
            color: "#ffffff",
            fontFamily: FONT_IMPACT,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          TU SAIS CE QUE VEUT DIRE
        </div>
      </div>

      {/* The TERM - MUCH BIGGER, glowing, centered + question mark */}
      <div
        style={{
          transform: `scale(${termScale})`,
          textAlign: "center",
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: style.highlightColor,
            fontFamily: FONT_IMPACT,
            textShadow: `0 0 60px ${style.highlightColor}90, 0 0 120px ${style.highlightColor}50`,
            letterSpacing: 4,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {hook.term}
          <span
            style={{
              fontSize: 200,
              transform: `translateY(${questionMarkBounce}px)`,
              display: "inline-block",
            }}
          >
            ?
          </span>
        </div>
      </div>

      {/* "Décodons les paroles" with arrow */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          opacity: decodonsOpacity,
          transform: `translateX(${decodonsX}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 42,
            color: "rgba(255,255,255,0.9)",
            fontFamily: FONT_IMPACT,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 4,
            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          }}
        >
          DÉCODONS LES PAROLES
        </div>
        {/* Arrow pointing right */}
        <div
          style={{
            transform: `translateX(${arrowBounce}px)`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke={style.highlightColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 15px ${style.highlightColor}80)`,
            }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
