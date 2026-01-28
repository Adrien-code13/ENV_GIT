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

  // Question mark bounce
  const questionScale = spring({
    frame: frame - 2,
    fps,
    config: { damping: 6, stiffness: 200, mass: 0.4 },
  });

  // Subtitle fade in
  const subtitleOpacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background gradient rotation
  const gradientAngle = interpolate(frame, [0, 90], [135, 225]);

  // Line preview slide up
  const lineY = interpolate(frame, [20, 35], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [20, 35], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${style.highlightColor}40 0%, transparent 70%)`,
          opacity: pulse,
          filter: "blur(40px)",
        }}
      />

      {/* "Tu sais ce que veut dire..." */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          opacity: questionScale,
          transform: `scale(${questionScale})`,
        }}
      >
        <div
          style={{
            fontSize: 38,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          Tu sais ce que veut dire...
        </div>
      </div>

      {/* The TERM - big, glowing, centered */}
      <div
        style={{
          transform: `scale(${termScale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: style.highlightColor,
            fontFamily: "'Inter', sans-serif",
            textShadow: `0 0 40px ${style.highlightColor}80, 0 0 80px ${style.highlightColor}40`,
            letterSpacing: -2,
          }}
        >
          "{hook.term}"
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            marginTop: 16,
            opacity: subtitleOpacity,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          ? ? ?
        </div>
      </div>

      {/* Preview of the lyrics line */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: lineOpacity,
          transform: `translateY(${lineY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Inter', sans-serif",
            fontStyle: "italic",
            lineHeight: 1.6,
          }}
        >
          "{hook.line}"
        </div>
      </div>

      {/* Bottom indicator - "Swipe pour découvrir" */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          opacity: subtitleOpacity * 0.6,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderLeft: "2px solid rgba(255,255,255,0.3)",
            borderBottom: "2px solid rgba(255,255,255,0.3)",
            transform: `rotate(-45deg) translateY(${Math.sin(frame * 0.1) * 5}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
