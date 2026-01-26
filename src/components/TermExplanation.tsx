import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import type { TermExplanation as TermExplanationType, VideoStyle } from "../types";

interface TermExplanationProps {
  term: TermExplanationType;
  style: VideoStyle;
  progress: number;
}

export const TermExplanationPopup: React.FC<TermExplanationProps> = ({
  term,
  style,
  progress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance and exit animations
  const scale = spring({
    frame: Math.floor(progress * fps * 3),
    fps,
    config: {
      damping: 12,
      stiffness: 150,
      mass: 0.8,
    },
  });

  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(progress, [0, 0.1, 0.85, 1], [30, 0, 0, -20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Category badge colors
  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case "argot":
        return "#e74c3c";
      case "verlan":
        return "#9b59b6";
      case "reference":
        return "#3498db";
      case "anglicisme":
        return "#2ecc71";
      case "expression":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getCategoryLabel = (category?: string): string => {
    switch (category) {
      case "argot":
        return "Argot";
      case "verlan":
        return "Verlan";
      case "reference":
        return "Référence";
      case "anglicisme":
        return "Anglicisme";
      case "expression":
        return "Expression";
      default:
        return "Terme";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "15%",
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px) scale(${Math.min(scale, 1)})`,
        opacity,
        backgroundColor: style.explanationBgColor,
        borderRadius: 20,
        padding: "30px 40px",
        maxWidth: "85%",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        border: `2px solid ${style.highlightColor}`,
      }}
    >
      {/* Category badge */}
      {term.category && (
        <div
          style={{
            position: "absolute",
            top: -15,
            left: 30,
            backgroundColor: getCategoryColor(term.category),
            color: "#fff",
            padding: "6px 16px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: "bold",
            fontFamily: style.fontFamily,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {getCategoryLabel(term.category)}
        </div>
      )}

      {/* Term */}
      <div
        style={{
          fontSize: style.fontSize * 0.7,
          fontWeight: "bold",
          color: style.highlightColor,
          fontFamily: style.fontFamily,
          marginBottom: 15,
          marginTop: term.category ? 10 : 0,
        }}
      >
        "{term.term}"
      </div>

      {/* Definition */}
      <div
        style={{
          fontSize: style.fontSize * 0.45,
          color: style.textColor,
          fontFamily: style.fontFamily,
          lineHeight: 1.5,
        }}
      >
        {term.definition}
      </div>

      {/* Example (if provided) */}
      {term.example && (
        <div
          style={{
            marginTop: 15,
            padding: "12px 20px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 10,
            fontSize: style.fontSize * 0.35,
            color: "rgba(255, 255, 255, 0.8)",
            fontFamily: style.fontFamily,
            fontStyle: "italic",
          }}
        >
          💡 {term.example}
        </div>
      )}
    </div>
  );
};
