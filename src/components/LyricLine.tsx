import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";
import type { LyricLine as LyricLineType, VideoStyle } from "../types";

interface LyricLineProps {
  line: LyricLineType;
  style: VideoStyle;
  isActive: boolean;
  progress: number;
}

export const LyricLine: React.FC<LyricLineProps> = ({
  line,
  style,
  isActive,
  progress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation based on style
  const getAnimatedStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      color: isActive ? style.highlightColor : style.textColor,
      textAlign: "center",
      padding: "20px 40px",
      lineHeight: 1.4,
      textShadow: isActive ? "0 0 20px rgba(255, 107, 53, 0.5)" : "none",
      transition: "all 0.3s ease",
    };

    switch (style.animationStyle) {
      case "fade": {
        const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return { ...baseStyles, opacity };
      }

      case "slide": {
        const translateY = interpolate(
          progress,
          [0, 0.1, 0.9, 1],
          [50, 0, 0, -50],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );
        const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return {
          ...baseStyles,
          opacity,
          transform: `translateY(${translateY}px)`,
        };
      }

      case "bounce": {
        const scale = spring({
          frame: Math.floor(progress * fps * 2),
          fps,
          config: {
            damping: 10,
            stiffness: 100,
            mass: 0.5,
          },
        });
        return {
          ...baseStyles,
          transform: `scale(${scale})`,
        };
      }

      case "typewriter": {
        const visibleChars = Math.floor(progress * line.text.length * 1.2);
        return {
          ...baseStyles,
          clipPath: `inset(0 ${100 - (visibleChars / line.text.length) * 100}% 0 0)`,
        };
      }

      default:
        return baseStyles;
    }
  };

  // Highlight terms in the text
  const renderTextWithHighlights = () => {
    if (line.terms.length === 0) {
      return line.text;
    }

    let result = line.text;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort terms by their position in the text
    const termPositions = line.terms
      .map((term) => ({
        term,
        index: line.text.toLowerCase().indexOf(term.term.toLowerCase()),
      }))
      .filter((t) => t.index !== -1)
      .sort((a, b) => a.index - b.index);

    termPositions.forEach(({ term, index }, i) => {
      // Add text before the term
      if (index > lastIndex) {
        elements.push(line.text.slice(lastIndex, index));
      }

      // Add the highlighted term
      elements.push(
        <span
          key={`term-${i}`}
          style={{
            color: style.highlightColor,
            fontWeight: "bold",
            textDecoration: "underline",
            textDecorationStyle: "dotted",
          }}
        >
          {line.text.slice(index, index + term.term.length)}
        </span>
      );

      lastIndex = index + term.term.length;
    });

    // Add remaining text
    if (lastIndex < line.text.length) {
      elements.push(line.text.slice(lastIndex));
    }

    return elements.length > 0 ? elements : line.text;
  };

  return (
    <div style={getAnimatedStyles()}>
      {renderTextWithHighlights()}
    </div>
  );
};
