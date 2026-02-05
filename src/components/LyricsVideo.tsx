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

  // Current terms to display
  const currentTerms = useMemo(() => {
    if (activeLine && activeLine.terms.length > 0) {
      const progress = getLineProgress(activeLine);
      if (progress >= 0.05) return activeLine.terms;
    }
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
          {/* --- Rich gradient background --- */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(170deg,
              ${BG1} 0%, #0f1a30 20%, ${BG2} 45%, #0d1528 70%, ${BG1} 100%)`,
            }}
          />

          {/* --- Ambient color blobs --- */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "-15%",
              width: 700,
              height: 700,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${HL}15 0%, transparent 65%)`,
              filter: "blur(100px)",
              opacity: 0.9,
              transform: `translate(${drift}px, ${drift * 0.5}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "-10%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 60%)`,
              filter: "blur(80px)",
              opacity: 0.8,
              transform: `translate(${-drift}px, ${drift * 0.3}px)`,
            }}
          />

          {/* --- Animated glow streak --- */}
          <div
            style={{
              position: "absolute",
              top: -200,
              left: "20%",
              width: 300,
              height: 1000,
              background: `linear-gradient(180deg, ${ACCENT}18 0%, transparent 60%)`,
              opacity: pulse,
              filter: "blur(50px)",
              transform: `skewX(-20deg) translateY(${drift}px)`,
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
                }}
              >
                <div
                  style={{
                    fontSize: 68,
                    fontWeight: 900,
                    color: "#ffffff",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    letterSpacing: 4,
                    textShadow: `0 4px 30px rgba(0,0,0,0.6)`,
                    marginBottom: 30,
                    lineHeight: 1.2,
                  }}
                >
                  ALORS, TU EN AVAIS COMBIEN ?
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
                    marginBottom: 40,
                  }}
                >
                  {decodedTerms}/{totalTerms}
                </div>

                {/* CTA: COMMENTE */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${HL}, ${HL}cc)`,
                    borderRadius: 16,
                    padding: "20px 50px",
                    display: "inline-block",
                    boxShadow: `0 0 40px ${HL}50, 0 8px 30px rgba(0,0,0,0.4)`,
                    transform: `scale(${0.95 + Math.sin(frame * 0.1) * 0.05})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 900,
                      color: "#000",
                      fontFamily: FONT,
                      letterSpacing: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    COMMENTE TON SCORE
                  </div>
                </div>

                {/* FOLLOW */}
                <div
                  style={{
                    marginTop: 30,
                    opacity: 0.7 + Math.sin(frame * 0.15) * 0.3,
                  }}
                >
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: FONT,
                      letterSpacing: 6,
                      textTransform: "uppercase",
                      textShadow: `0 0 20px ${ACCENT}40`,
                    }}
                  >
                    FOLLOW POUR LA SUITE
                  </div>
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
                      width: 90,
                      height: 90,
                      borderRadius: 12,
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
                      fontSize: 46,
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
                      fontSize: 28,
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: FONT,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      marginTop: 2,
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
                  top: SAFE.top + 110,
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
                    height: 20,
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
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
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
                      fontSize: 30,
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

              {/* ========== LYRICS — ALL lines visible, active highlighted, bigger ========== */}
              <div
                style={{
                  position: "absolute",
                  top: SAFE.top + 210,
                  left: SAFE.left,
                  right: SAFE.right,
                  bottom: 700,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: 10,
                }}
              >
                {lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPast = currentTime >= line.endTime;
                  const isFuture = currentTime < line.startTime;
                  const progress = isActive ? getLineProgress(line) : 0;

                  // All lines visible — more visible inactive
                  let opacity = 0.35;
                  if (isActive) opacity = 1;
                  else if (isPast) opacity = 0.40;

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
                            padding: "2px 12px",
                            borderRadius: 5,
                            marginLeft: 3,
                            marginRight: 3,
                            boxShadow: `0 0 20px ${HL}70`,
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
                        padding: "10px 0",
                        position: "relative",
                        transform: isActive ? `scale(${0.95 + lineEntrance * 0.05})` : "scale(1)",
                        transformOrigin: "left center",
                      }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            left: -4,
                            top: 6,
                            bottom: 6,
                            width: 5,
                            borderRadius: 3,
                            background: `linear-gradient(180deg, ${HL}, ${ACCENT})`,
                            boxShadow: `0 0 18px ${HL}80`,
                          }}
                        />
                      )}

                      <div
                        style={{
                          fontSize: isActive ? 50 : 42,
                          fontWeight: 900,
                          color: isPast
                            ? "rgba(255,255,255,0.40)"
                            : isFuture
                              ? "rgba(255,255,255,0.30)"
                              : "#ffffff",
                          fontFamily: FONT,
                          textTransform: "uppercase",
                          lineHeight: 1.3,
                          letterSpacing: 1,
                          paddingLeft: isActive ? 18 : 8,
                          textShadow: isActive
                            ? `0 2px 12px rgba(0,0,0,0.5), 0 0 25px ${HL}15`
                            : "none",
                        }}
                      >
                        {renderText()}
                      </div>

                      {/* Progress bar under active line */}
                      {isActive && (
                        <div
                          style={{
                            marginTop: 8,
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
