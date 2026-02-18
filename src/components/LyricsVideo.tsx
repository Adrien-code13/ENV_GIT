import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  interpolate,
} from "remotion";
import type { RapLyricsVideo, LyricLine as LyricLineType, TermExplanation } from "../types";
import { HookScreen } from "./HookScreen";

interface LyricsVideoProps {
  data: RapLyricsVideo;
}

// Safe zones for TikTok / YouTube Shorts
const SAFE = { top: 150, bottom: 320, left: 80, right: 130 };

export const LyricsVideo: React.FC<LyricsVideoProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const { track, lyrics, style, hook } = data;
  const hookDurationFrames = hook ? Math.ceil(hook.duration * fps) : 0;

  const contentFrame = frame - hookDurationFrames;
  const currentTime = contentFrame / fps;
  const isHookPhase = frame < hookDurationFrames;

  // Calculate when all lyrics end
  const lyricsEndTime = useMemo(() => {
    if (lyrics.length === 0) return 0;
    return Math.max(...lyrics.map(l => l.endTime));
  }, [lyrics]);

  // End screen (1.5s)
  const isEndScreen = currentTime >= lyricsEndTime && !isHookPhase;

  // === COLORS ===
  const HL = style.highlightColor;
  const ACCENT = "#38bdf8";
  const BG1 = style.backgroundColor;
  const BG2 = style.secondaryColor ?? "#101d35";
  const BG_BASE = "#0b1120";

  // === STATE ===
  const activeLine = useMemo(() => {
    if (isHookPhase || isEndScreen) return null;
    return lyrics.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
  }, [lyrics, currentTime, isHookPhase, isEndScreen]);

  const activeLineIndex = useMemo(() => {
    if (!activeLine) return -1;
    return lyrics.indexOf(activeLine);
  }, [activeLine, lyrics]);

  const getLineProgress = (line: LyricLineType): number => {
    if (currentTime < line.startTime) return 0;
    if (currentTime >= line.endTime) return 1;
    return (currentTime - line.startTime) / (line.endTime - line.startTime);
  };

  const totalTerms = useMemo(
    () => lyrics.reduce((sum, l) => sum + l.terms.length, 0),
    [lyrics]
  );

  const decodedTerms = useMemo(() => {
    if (isHookPhase) return 0;
    let count = 0;
    for (const line of lyrics) {
      if (currentTime >= line.endTime) {
        count += line.terms.length;
      } else if (currentTime >= line.startTime && line.terms.length > 0) {
        const progress = getLineProgress(line);
        if (progress > 0.4) count += line.terms.length;
      }
    }
    return Math.min(count, totalTerms);
  }, [lyrics, currentTime, totalTerms, isHookPhase]);

  // Current terms to display — if active line has no terms, show nothing
  const currentTerms = useMemo(() => {
    if (activeLine) {
      if (activeLine.terms.length === 0) return [];
      const progress = getLineProgress(activeLine);
      if (progress >= 0.05) return activeLine.terms;
      return [];
    }
    // Between lines: keep showing previous line's terms briefly
    for (let i = activeLineIndex; i >= 0; i--) {
      const line = lyrics[i];
      if (line && line.terms.length > 0 && currentTime >= line.startTime) {
        return line.terms;
      }
    }
    return [];
  }, [activeLine, activeLineIndex, lyrics, currentTime]);

  // === ANIMATIONS ===
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;
  const fastPulse = Math.sin(frame * 0.2) * 0.5 + 0.5;
  const drift = Math.sin(frame * 0.015) * 15;

  // === GLITCH on line transitions ===
  const isLineTransition = useMemo(() => {
    if (!activeLine) return false;
    const lineStartFrame = activeLine.startTime * fps;
    return contentFrame >= lineStartFrame && contentFrame < lineStartFrame + 4;
  }, [activeLine, contentFrame, fps]);

  const glitchProgress = activeLine
    ? (contentFrame - activeLine.startTime * fps) / 4
    : 0;

  const shakeX = isLineTransition
    ? Math.sin(contentFrame * 5) * 8 * (1 - glitchProgress)
    : 0;
  const shakeY = isLineTransition
    ? Math.cos(contentFrame * 7) * 6 * (1 - glitchProgress)
    : 0;

  const flashOpacity = isLineTransition
    ? interpolate(glitchProgress, [0, 0.25, 0.75], [0.5, 0.2, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  // Progress bar
  const progressRatio = totalTerms > 0 ? decodedTerms / totalTerms : 0;

  const endScreenScale = spring({
    frame: isEndScreen ? Math.floor((currentTime - lyricsEndTime) * fps) : 0,
    fps,
    config: { damping: 6, stiffness: 150, mass: 0.5 },
  });

  // Category styling
  const getCategoryColor = (cat?: string) => {
    const colors: Record<string, string> = {
      argot: "#00e676", verlan: "#a855f7", reference: "#f59e0b",
      anglicisme: "#38bdf8", expression: "#fb923c",
    };
    return colors[cat ?? ""] ?? "#aaa";
  };
  const getCategoryLabel = (cat?: string) => {
    const labels: Record<string, string> = {
      argot: "ARGOT", verlan: "VERLAN", reference: "REF",
      anglicisme: "ANGL.", expression: "EXPR.",
    };
    return labels[cat ?? ""] ?? "TERME";
  };

  const FONT = "'Impact', 'Arial Black', sans-serif";

  // End screen: fade to black for loop
  const endScreenTime = currentTime - lyricsEndTime;
  const endFadeOpacity = isEndScreen
    ? interpolate(endScreenTime, [1.2, 1.5], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  // Gamified progress: build segments array
  const termSegments = useMemo(() => {
    const segs: { lineIndex: number; termIndex: number }[] = [];
    lyrics.forEach((line, li) => {
      line.terms.forEach((_, ti) => {
        segs.push({ lineIndex: li, termIndex: ti });
      });
    });
    return segs;
  }, [lyrics]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      {/* ========== HOOK SCREEN ========== */}
      {hook && (
        <Sequence from={0} durationInFrames={hookDurationFrames}>
          <HookScreen hook={hook} style={style} />
        </Sequence>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <Sequence from={hookDurationFrames}>
        <AbsoluteFill
          style={{
            transform: `translate(${shakeX}px, ${shakeY}px)`,
            opacity: endFadeOpacity,
          }}
        >
          {/* --- Animated gradient background --- */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${interpolate(contentFrame, [0, 300], [170, 210])}deg,
              ${BG1} 0%, #0f1a30 20%, ${BG2} 45%, #0d1528 70%, ${BG1} 100%)`,
            }}
          />

          {/* --- Floating animated orbs --- */}
          {[
            { x: 15, y: 10, size: 500, speed: 0.008, color: HL, blur: 120, opacity: 0.6 },
            { x: 75, y: 80, size: 400, speed: 0.012, color: ACCENT, blur: 100, opacity: 0.5 },
            { x: 50, y: 40, size: 350, speed: 0.015, color: HL, blur: 90, opacity: 0.4 },
            { x: 85, y: 20, size: 300, speed: 0.01, color: ACCENT, blur: 80, opacity: 0.35 },
            { x: 30, y: 70, size: 250, speed: 0.018, color: HL, blur: 70, opacity: 0.3 },
          ].map((orb, i) => {
            const orbX = orb.x + Math.sin(contentFrame * orb.speed + i * 2) * 12;
            const orbY = orb.y + Math.cos(contentFrame * orb.speed * 0.7 + i) * 10;
            const orbPulse = 0.6 + Math.sin(contentFrame * 0.04 + i * 1.5) * 0.4;
            return (
              <div
                key={`orb-${i}`}
                style={{
                  position: "absolute",
                  left: `${orbX}%`,
                  top: `${orbY}%`,
                  width: orb.size,
                  height: orb.size,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${orb.color}25 0%, transparent 70%)`,
                  filter: `blur(${orb.blur}px)`,
                  opacity: orb.opacity * orbPulse,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}

          {/* --- Floating particles --- */}
          {Array.from({ length: 20 }).map((_, i) => {
            const seed = i * 137.5;
            const particleX = ((seed * 7.3) % 100);
            const particleBaseY = ((seed * 3.7) % 100);
            const particleY = particleBaseY + Math.sin(contentFrame * 0.02 + i) * 8;
            const particleSize = 3 + (i % 4) * 2;
            const particleOpacity = 0.15 + Math.sin(contentFrame * 0.05 + i * 0.8) * 0.15;
            const particleColor = i % 3 === 0 ? HL : i % 3 === 1 ? ACCENT : "#ffffff";
            return (
              <div
                key={`particle-${i}`}
                style={{
                  position: "absolute",
                  left: `${particleX}%`,
                  top: `${particleY}%`,
                  width: particleSize,
                  height: particleSize,
                  borderRadius: "50%",
                  background: particleColor,
                  opacity: particleOpacity,
                  boxShadow: `0 0 ${particleSize * 3}px ${particleColor}60`,
                }}
              />
            );
          })}

          {/* --- Animated glow streaks --- */}
          <div
            style={{
              position: "absolute",
              top: -200,
              left: "20%",
              width: 200,
              height: 1200,
              background: `linear-gradient(180deg, ${ACCENT}12 0%, transparent 50%)`,
              opacity: pulse * 0.7,
              filter: "blur(40px)",
              transform: `skewX(-25deg) translateY(${drift * 1.5}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -100,
              right: "15%",
              width: 150,
              height: 1000,
              background: `linear-gradient(180deg, ${HL}10 0%, transparent 50%)`,
              opacity: fastPulse * 0.5,
              filter: "blur(35px)",
              transform: `skewX(20deg) translateY(${-drift}px)`,
            }}
          />

          {/* === GLITCH FLASH overlay === */}
          {flashOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 200,
                background: `radial-gradient(circle at 50% 40%, ${HL}80 0%, transparent 60%)`,
                opacity: flashOpacity,
                pointerEvents: "none",
              }}
            />
          )}

          {/* ========== END SCREEN ========== */}
          {isEndScreen ? (
            <AbsoluteFill
              style={{
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
                padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
              }}
            >
              {/* Big glow */}
              <div
                style={{
                  position: "absolute",
                  width: 900,
                  height: 900,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${HL}40 0%, ${ACCENT}20 40%, transparent 60%)`,
                  opacity: pulse,
                  filter: "blur(80px)",
                }}
              />

              <div
                style={{
                  transform: `scale(${endScreenScale})`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Question */}
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#ffffff",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    textShadow: `0 4px 30px rgba(0,0,0,0.6)`,
                    marginBottom: 20,
                    lineHeight: 1.2,
                  }}
                >
                  TU CONNAISSAIS
                  <br />
                  COMBIEN DE TERMES ?
                </div>

                {/* Score */}
                <div
                  style={{
                    fontSize: 130,
                    fontWeight: 900,
                    color: HL,
                    fontFamily: FONT,
                    lineHeight: 1,
                    textShadow: `0 0 60px ${HL}80, 0 0 120px ${HL}40`,
                    marginBottom: 24,
                  }}
                >
                  {totalTerms}
                </div>

                {/* All terms as chips */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    marginBottom: 30,
                    maxWidth: 800,
                  }}
                >
                  {lyrics.flatMap(line => line.terms).filter((t, i, arr) =>
                    arr.findIndex(x => x.term.toLowerCase() === t.term.toLowerCase()) === i
                  ).map((term, i) => (
                    <div
                      key={i}
                      style={{
                        background: `${getCategoryColor(term.category)}25`,
                        border: `2px solid ${getCategoryColor(term.category)}80`,
                        borderRadius: 10,
                        padding: "6px 16px",
                        transform: `scale(${0.9 + Math.sin((frame + i * 5) * 0.1) * 0.05})`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: getCategoryColor(term.category),
                          fontFamily: FONT,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {term.term}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA: COMMENTE */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${HL}, ${HL}cc)`,
                    borderRadius: 16,
                    padding: "18px 44px",
                    display: "inline-block",
                    boxShadow: `0 0 40px ${HL}50, 0 8px 30px rgba(0,0,0,0.4)`,
                    transform: `scale(${0.95 + Math.sin(frame * 0.1) * 0.05})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      color: "#000",
                      fontFamily: FONT,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                    }}
                  >
                    COMMENTE TON SCORE !
                  </div>
                </div>

                {/* Follow CTA */}
                <div
                  style={{
                    marginTop: 24,
                    fontSize: 30,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: FONT,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    transform: `translateY(${Math.sin(frame * 0.12) * 5}px)`,
                  }}
                >
                  FOLLOW POUR LA SUITE
                </div>
              </div>
            </AbsoluteFill>
          ) : (
            <>
              {/* ========== HEADER (cover + track) ABOVE progress bar ========== */}
              <div
                style={{
                  position: "absolute",
                  top: SAFE.top,
                  left: SAFE.left,
                  right: SAFE.right,
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                {track.coverImage && (
                  <div
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 14,
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: `0 0 0 3px ${HL}80, 0 0 20px ${HL}40, 0 4px 20px rgba(0,0,0,0.5)`,
                    }}
                  >
                    <Img
                      src={staticFile(track.coverImage)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 900,
                      color: "#fff",
                      fontFamily: FONT,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      lineHeight: 1.1,
                      textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: FONT,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      marginTop: 4,
                    }}
                  >
                    {track.artist}
                  </div>
                </div>
              </div>

              {/* ========== GAMIFIED PROGRESS BAR (below header) ========== */}
              <div
                style={{
                  position: "absolute",
                  top: SAFE.top + 145,
                  left: SAFE.left,
                  right: SAFE.right,
                  zIndex: 20,
                }}
              >
                {/* Segmented bar */}
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    height: 26,
                    alignItems: "center",
                  }}
                >
                  {termSegments.map((seg, i) => {
                    const isFilled = i < decodedTerms;
                    const isNext = i === decodedTerms;
                    const segPulse = isNext
                      ? 0.5 + Math.sin(frame * 0.15) * 0.5
                      : 0;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: "100%",
                          borderRadius: 6,
                          background: isFilled
                            ? `linear-gradient(90deg, ${HL}, ${ACCENT})`
                            : isNext
                              ? `rgba(255,255,255,${0.08 + segPulse * 0.12})`
                              : "rgba(255,255,255,0.06)",
                          boxShadow: isFilled
                            ? `0 0 14px ${HL}60`
                            : "none",
                          transition: "background 0.3s ease",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Score text — bigger */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 50,
                      fontWeight: 900,
                      color: HL,
                      fontFamily: FONT,
                      letterSpacing: 2,
                      textShadow: `0 0 20px ${HL}60`,
                    }}
                  >
                    {decodedTerms}/{totalTerms}
                  </div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: FONT,
                      letterSpacing: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    DÉCODÉS
                  </div>
                </div>
              </div>

              {/* ========== LYRICS — Adaptive sizing, only visible lines ========== */}
              {(() => {
                // Calculate adaptive font size based on content
                const avgLineLength = lyrics.reduce((sum, l) => sum + l.text.length, 0) / lyrics.length;
                const maxLineLength = Math.max(...lyrics.map(l => l.text.length));
                const lineCount = lyrics.length;

                // Determine content "weight" for adaptive sizing
                // Heavy content = many long lines = smaller font
                const contentWeight = (lineCount * avgLineLength) / 100;

                let baseFontSize: number;
                let smallFontSize: number;
                if (contentWeight > 8 || maxLineLength > 120) {
                  // Very heavy content
                  baseFontSize = 46;
                  smallFontSize = 38;
                } else if (contentWeight > 5 || maxLineLength > 80) {
                  // Medium content
                  baseFontSize = 54;
                  smallFontSize = 44;
                } else {
                  // Light content: larger fonts
                  baseFontSize = 60;
                  smallFontSize = 48;
                }

                // Only show 4 lines max: previous, active, next two
                const effectiveIndex = Math.max(0, activeLineIndex);
                const windowStart = Math.max(0, effectiveIndex - 1);
                const windowEnd = Math.min(lyrics.length - 1, effectiveIndex + 2);
                const visibleLines = lyrics.slice(windowStart, windowEnd + 1);

                // Smooth transition progress for line changes
                const scrollProgress = activeLine
                  ? interpolate(
                      getLineProgress(activeLine),
                      [0.9, 1],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    )
                  : 0;

                return (
                  <div
                    style={{
                      position: "absolute",
                      top: SAFE.top + 270,
                      left: SAFE.left,
                      right: SAFE.right,
                      bottom: SAFE.bottom + 260,
                      zIndex: 10,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      gap: 20,
                      overflow: "hidden",
                    }}
                  >
                    {visibleLines.map((line, visibleIdx) => {
                      const actualIndex = windowStart + visibleIdx;
                      const isActive = actualIndex === activeLineIndex;
                      const isPast = currentTime >= line.endTime;
                      const isFuture = currentTime < line.startTime;
                      const progress = isActive ? getLineProgress(line) : 0;

                      // Position in visible window
                      const positionInWindow = actualIndex - effectiveIndex;

                      // Opacity based on position
                      let opacity = 0;
                      if (isActive) opacity = 1;
                      else if (positionInWindow === -1) opacity = 0.4; // previous
                      else if (positionInWindow === 1) opacity = 0.35; // next
                      else if (positionInWindow === 2) opacity = 0.25; // next+1
                      else opacity = 0.2;

                      // Fade out previous line as we approach transition
                      if (positionInWindow === -1 && scrollProgress > 0) {
                        opacity = 0.4 * (1 - scrollProgress);
                      }

                      // Subtle scale for active
                      const lineEntrance = isActive
                        ? spring({
                            frame: Math.max(0, contentFrame - line.startTime * fps),
                            fps,
                            config: { damping: 8, stiffness: 200, mass: 0.4 },
                          })
                        : 1;

                      const renderText = () => {
                        if (line.terms.length === 0 || !isActive) return line.text;

                        const elements: React.ReactNode[] = [];
                        let lastIdx = 0;

                        const termPositions = line.terms
                          .map((t) => ({
                            term: t,
                            index: line.text.toLowerCase().indexOf(t.term.toLowerCase()),
                          }))
                          .filter((t) => t.index !== -1)
                          .sort((a, b) => a.index - b.index);

                        termPositions.forEach(({ term, index: tIdx }, i) => {
                          if (tIdx > lastIdx) {
                            elements.push(
                              <span key={`pre-${i}`}>
                                {line.text.slice(lastIdx, tIdx)}
                              </span>
                            );
                          }
                          elements.push(
                            <span
                              key={`term-${i}`}
                              style={{
                                color: "#000",
                                fontWeight: 900,
                                background: HL,
                                padding: "2px 10px",
                                borderRadius: 4,
                                marginLeft: 2,
                                marginRight: 2,
                                boxShadow: `0 0 16px ${HL}70`,
                                display: "inline-block",
                              }}
                            >
                              {line.text.slice(tIdx, tIdx + term.term.length)}
                            </span>
                          );
                          lastIdx = tIdx + term.term.length;
                        });

                        if (lastIdx < line.text.length) {
                          elements.push(
                            <span key="rest">{line.text.slice(lastIdx)}</span>
                          );
                        }
                        return elements.length > 0 ? elements : line.text;
                      };

                      return (
                        <div
                          key={line.id}
                          style={{
                            opacity,
                            padding: "6px 0",
                            position: "relative",
                            transform: isActive ? `scale(${0.97 + lineEntrance * 0.03})` : "scale(1)",
                            transformOrigin: "left center",
                            transition: "opacity 0.4s ease",
                          }}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div
                              style={{
                                position: "absolute",
                                left: -4,
                                top: 4,
                                bottom: 4,
                                width: 4,
                                borderRadius: 2,
                                background: `linear-gradient(180deg, ${HL}, ${ACCENT})`,
                                boxShadow: `0 0 14px ${HL}80`,
                              }}
                            />
                          )}

                          <div
                            style={{
                              fontSize: isActive ? baseFontSize : smallFontSize,
                              fontWeight: 900,
                              color: isPast
                                ? "rgba(255,255,255,0.5)"
                                : isFuture
                                  ? "rgba(255,255,255,0.4)"
                                  : "#ffffff",
                              fontFamily: FONT,
                              textTransform: "uppercase",
                              lineHeight: 1.3,
                              letterSpacing: 0.3,
                              paddingLeft: isActive ? 14 : 6,
                              textShadow: isActive
                                ? `0 2px 10px rgba(0,0,0,0.5), 0 0 20px ${HL}15`
                                : "none",
                            }}
                            >
                              {renderText()}
                            </div>

                            {/* Progress bar under active line */}
                            {isActive && (
                              <div
                                style={{
                                  marginTop: 6,
                                  marginLeft: 18,
                                  height: 3,
                                  borderRadius: 2,
                                  background: "rgba(255,255,255,0.06)",
                                  overflow: "hidden",
                                  width: "85%",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress * 100}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${HL}, ${ACCENT})`,
                                    boxShadow: `0 0 10px ${HL}60`,
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })()}

              {/* ========== DECODE CARDS — Full width, bottom, BIGGER ========== */}
              <div
                style={{
                  position: "absolute",
                  bottom: SAFE.bottom + 10,
                  left: SAFE.left,
                  right: SAFE.right,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {currentTerms.length > 0
                  ? currentTerms.map((term, i) => {
                      const tFrame =
                        contentFrame -
                        (activeLine ? activeLine.startTime * fps : 0);

                      // Card slide-up entrance
                      const s = spring({
                        frame: Math.max(0, tFrame - i * 4),
                        fps,
                        config: { damping: 6, stiffness: 220, mass: 0.5 },
                      });

                      // Term slam (zoom from 1.5 to 1)
                      const termSlam = spring({
                        frame: Math.max(0, tFrame - i * 4 - 2),
                        fps,
                        config: { damping: 5, stiffness: 180, mass: 0.6 },
                      });

                      // Definition typewriter
                      const defDelay = 8 + i * 4;
                      const defProgress = Math.max(0, tFrame - defDelay);
                      const charsToShow = Math.min(
                        Math.floor(defProgress * 2.2),
                        term.definition.length
                      );
                      const visibleDef = term.definition.slice(0, charsToShow);
                      const showCursor =
                        charsToShow < term.definition.length && defProgress > 0;
                      const defDone =
                        charsToShow >= term.definition.length && defProgress > 0;

                      // "TU SAVAIS ?" — hook term only
                      const tuSavaisFrame = defDone
                        ? Math.max(
                            0,
                            tFrame -
                              defDelay -
                              Math.ceil(term.definition.length / 2.2) -
                              2
                          )
                        : 0;
                      const tuSavaisScale = spring({
                        frame: tuSavaisFrame,
                        fps,
                        config: { damping: 8, stiffness: 300, mass: 0.3 },
                      });

                      const glowPulse =
                        Math.sin(frame * 0.08 + i * 2) * 0.4 + 0.6;

                      return (
                        <div
                          key={`expl-${term.term}-${i}`}
                          style={{ position: "relative" }}
                        >
                          {/* Glow behind card */}
                          <div
                            style={{
                              position: "absolute",
                              inset: -15,
                              borderRadius: 22,
                              background: `radial-gradient(ellipse, ${HL}25 0%, transparent 70%)`,
                              opacity: s * glowPulse,
                              filter: "blur(25px)",
                              pointerEvents: "none",
                            }}
                          />

                          <div
                            style={{
                              position: "relative",
                              background: `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)`,
                              borderRadius: 18,
                              padding: "26px 30px",
                              borderLeft: `6px solid ${HL}`,
                              transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + s * 0.15})`,
                              opacity: s,
                              boxShadow: `0 4px 30px rgba(0,0,0,0.3), -5px 0 25px ${HL}20`,
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            {/* Category + Term row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                marginBottom: 12,
                              }}
                            >
                              {term.category && (
                                <div
                                  style={{
                                    background: getCategoryColor(term.category),
                                    color: "#000",
                                    fontSize: 24,
                                    fontWeight: 900,
                                    padding: "6px 18px",
                                    borderRadius: 8,
                                    fontFamily: FONT,
                                    letterSpacing: 3,
                                    textTransform: "uppercase",
                                    boxShadow: `0 3px 15px ${getCategoryColor(term.category)}50`,
                                  }}
                                >
                                  {getCategoryLabel(term.category)}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 56,
                                  fontWeight: 900,
                                  color: HL,
                                  fontFamily: FONT,
                                  textTransform: "uppercase",
                                  letterSpacing: 2,
                                  textShadow: `0 0 25px ${HL}70`,
                                  lineHeight: 1.1,
                                  transform: `scale(${0.5 + termSlam * 0.5})`,
                                  opacity: termSlam,
                                }}
                              >
                                {term.term}
                              </div>
                            </div>

                            {/* Separator */}
                            <div
                              style={{
                                width: `${s * 100}%`,
                                height: 2,
                                background: `linear-gradient(90deg, ${HL}80, transparent)`,
                                marginBottom: 12,
                                borderRadius: 1,
                              }}
                            />

                            {/* Definition typewriter — BIGGER */}
                            <div
                              style={{
                                fontSize: 40,
                                color: "rgba(255,255,255,0.95)",
                                fontFamily: FONT,
                                fontWeight: 400,
                                lineHeight: 1.35,
                                minHeight: 50,
                              }}
                            >
                              {visibleDef}
                              {showCursor && (
                                <span
                                  style={{
                                    color: HL,
                                    opacity:
                                      Math.sin(frame * 0.3) > 0 ? 1 : 0,
                                    fontWeight: 900,
                                  }}
                                >
                                  |
                                </span>
                              )}
                            </div>

                            {/* "TU SAVAIS ?" — hook term only */}
                            {defDone &&
                              tuSavaisFrame > 0 &&
                              hook &&
                              term.term === hook.term && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    transform: `scale(${tuSavaisScale})`,
                                    opacity: tuSavaisScale,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 28,
                                      fontWeight: 900,
                                      color: HL,
                                      fontFamily: FONT,
                                      letterSpacing: 4,
                                      textTransform: "uppercase",
                                      textShadow: `0 0 15px ${HL}60`,
                                    }}
                                  >
                                    TU SAVAIS ?
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })
                  : !isEndScreen &&
                    activeLine &&
                    activeLine.terms.length === 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 100,
                            opacity: 0.4 + fastPulse * 0.3,
                            filter: `drop-shadow(0 0 30px ${ACCENT}40)`,
                          }}
                        >
                          😎
                        </div>
                        <div
                          style={{
                            fontSize: 28,
                            color: "rgba(255,255,255,0.6)",
                            fontFamily: FONT,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 5,
                          }}
                        >
                          TROP FACILE
                        </div>
                      </div>
                    )}
              </div>
            </>
          )}
        </AbsoluteFill>
      </Sequence>

      {/* ========== AUDIO — plays from start of video ========== */}
      {track.audioFile && <Audio src={staticFile(track.audioFile)} />}
    </AbsoluteFill>
  );
};
