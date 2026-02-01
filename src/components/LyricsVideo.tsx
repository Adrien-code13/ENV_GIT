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

  // End screen duration (2 seconds)
  const endScreenDuration = 2;
  const isEndScreen = currentTime >= lyricsEndTime && !isHookPhase;

  // === COLORS ===
  const HL = style.highlightColor;
  const ACCENT = "#38bdf8"; // electric blue
  const BG1 = style.backgroundColor;
  const BG2 = style.secondaryColor ?? "#101d35";
  const BG_BASE = "#0b1120"; // dark navy base

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

  // Track last shown terms to avoid blank spaces during transitions
  const { currentTerms, hasTermsToShow } = useMemo(() => {
    if (activeLine && activeLine.terms.length === 0) {
      return { currentTerms: [], hasTermsToShow: false };
    }
    if (activeLine && activeLine.terms.length > 0) {
      const progress = getLineProgress(activeLine);
      if (progress >= 0.05) {
        return { currentTerms: activeLine.terms, hasTermsToShow: true };
      }
    }
    for (let i = activeLineIndex; i >= 0; i--) {
      const line = lyrics[i];
      if (line && line.terms.length > 0 && currentTime >= line.startTime) {
        return { currentTerms: line.terms, hasTermsToShow: true };
      }
    }
    return { currentTerms: [], hasTermsToShow: false };
  }, [activeLine, activeLineIndex, lyrics, currentTime]);

  // === ANIMATIONS ===
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;
  const fastPulse = Math.sin(frame * 0.2) * 0.5 + 0.5;
  const drift = Math.sin(frame * 0.015) * 15;

  const counterPop = spring({
    frame: frame % 20,
    fps,
    config: { damping: 6, stiffness: 300, mass: 0.3 },
  });

  const endScreenScale = spring({
    frame: isEndScreen ? Math.floor((currentTime - lyricsEndTime) * fps) : 0,
    fps,
    config: { damping: 6, stiffness: 150, mass: 0.5 },
  });
  const qBounce = Math.sin(frame * 0.12) * 15;

  // Category styling — vibrant colors
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
        <AbsoluteFill>
          {/* --- Rich gradient background --- */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(170deg,
              ${BG1} 0%, #0f1a30 20%, ${BG2} 45%, #0d1528 70%, ${BG1} 100%)`,
          }} />

          {/* --- Ambient color blobs for depth --- */}
          <div style={{
            position: "absolute", top: "5%", left: "-15%",
            width: 700, height: 700, borderRadius: "50%",
            background: `radial-gradient(circle, ${HL}15 0%, transparent 65%)`,
            filter: "blur(100px)", opacity: 0.9,
            transform: `translate(${drift}px, ${drift * 0.5}px)`,
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "-10%",
            width: 600, height: 600, borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 60%)`,
            filter: "blur(80px)", opacity: 0.8,
            transform: `translate(${-drift}px, ${drift * 0.3}px)`,
          }} />
          <div style={{
            position: "absolute", top: "40%", left: "50%",
            width: 500, height: 500, borderRadius: "50%",
            background: `radial-gradient(circle, ${HL}08 0%, transparent 60%)`,
            filter: "blur(70px)", opacity: pulse,
            transform: "translate(-50%, -50%)",
          }} />

          {/* --- Optional background image --- */}
          {style.backgroundImage && (
            <div style={{
              position: "absolute", inset: 0, opacity: 0.12,
              filter: "brightness(0.5) contrast(1.2) saturate(0.5)",
              overflow: "hidden",
            }}>
              <Img
                src={staticFile(style.backgroundImage)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* --- Animated glow streaks --- */}
          <div style={{
            position: "absolute", top: -200, left: "20%",
            width: 300, height: 1000,
            background: `linear-gradient(180deg, ${ACCENT}18 0%, transparent 60%)`,
            opacity: pulse, filter: "blur(50px)",
            transform: `skewX(-20deg) translateY(${drift}px)`,
          }} />
          <div style={{
            position: "absolute", top: -100, right: "15%",
            width: 200, height: 800,
            background: `linear-gradient(180deg, ${HL}12 0%, transparent 50%)`,
            opacity: fastPulse, filter: "blur(40px)",
            transform: `skewX(15deg) translateY(${-drift}px)`,
          }} />

          {/* ========== END SCREEN ========== */}
          {isEndScreen ? (
            <AbsoluteFill style={{
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}>
              {/* Big glow */}
              <div style={{
                position: "absolute",
                width: 900, height: 900,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${HL}40 0%, ${ACCENT}20 40%, transparent 60%)`,
                opacity: pulse, filter: "blur(80px)",
              }} />

              {/* Main text */}
              <div style={{
                transform: `scale(${endScreenScale})`,
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 78, fontWeight: 900, color: "#ffffff",
                  fontFamily: FONT,
                  textTransform: "uppercase", letterSpacing: 4,
                  textShadow: `0 4px 30px rgba(0,0,0,0.6), 0 0 40px ${ACCENT}20`,
                  marginBottom: 20,
                }}>
                  ALORS, TU EN AVAIS
                </div>
                <div style={{
                  fontSize: 78, fontWeight: 900, color: "#ffffff",
                  fontFamily: FONT,
                  textTransform: "uppercase", letterSpacing: 4,
                  textShadow: `0 4px 30px rgba(0,0,0,0.6), 0 0 40px ${ACCENT}20`,
                  marginBottom: 40,
                }}>
                  COMBIEN
                </div>

                {/* Giant question mark */}
                <div style={{
                  fontSize: 300, fontWeight: 900, color: HL,
                  fontFamily: FONT,
                  textShadow: `0 0 80px ${HL}90, 0 0 160px ${HL}50`,
                  transform: `translateY(${qBounce}px)`,
                  lineHeight: 0.8,
                }}>
                  ?
                </div>

                {/* Score */}
                <div style={{
                  marginTop: 50, fontSize: 52,
                  color: HL,
                  fontFamily: FONT, fontWeight: 700,
                  textShadow: `0 0 20px ${HL}60`,
                }}>
                  {decodedTerms}/{totalTerms} décodés
                </div>

                {/* CTA: COMMENTE TON SCORE */}
                <div style={{
                  marginTop: 50,
                  background: `linear-gradient(135deg, ${HL}, ${HL}cc)`,
                  borderRadius: 16,
                  padding: "18px 40px",
                  display: "inline-block",
                  boxShadow: `0 0 40px ${HL}50, 0 8px 30px rgba(0,0,0,0.4)`,
                  transform: `scale(${0.95 + Math.sin(frame * 0.1) * 0.05})`,
                }}>
                  <div style={{
                    fontSize: 38, fontWeight: 900, color: "#000",
                    fontFamily: FONT, letterSpacing: 4,
                    textTransform: "uppercase",
                  }}>
                    COMMENTE TON SCORE
                  </div>
                </div>

                {/* CTA: FOLLOW */}
                <div style={{
                  marginTop: 25,
                  opacity: 0.7 + Math.sin(frame * 0.15) * 0.3,
                }}>
                  <div style={{
                    fontSize: 30, fontWeight: 900, color: "rgba(255,255,255,0.8)",
                    fontFamily: FONT, letterSpacing: 6,
                    textTransform: "uppercase",
                  }}>
                    FOLLOW POUR LA SUITE
                  </div>
                </div>
              </div>
            </AbsoluteFill>
          ) : (
            <>
              {/* ========== TOP HEADER ========== */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                padding: "55px 30px 20px", zIndex: 10,
                display: "flex", alignItems: "center", gap: 20,
              }}>
                {/* Cover art */}
                {track.coverImage && (
                  <div style={{
                    width: 90, height: 90, borderRadius: 10, overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: `0 0 0 3px ${HL}, 0 0 25px ${HL}40, 0 4px 25px rgba(0,0,0,0.6)`,
                  }}>
                    <Img
                      src={staticFile(track.coverImage)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Title */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 48, fontWeight: 900, color: "#fff",
                    fontFamily: FONT,
                    textTransform: "uppercase", letterSpacing: 2, lineHeight: 1.1,
                    textShadow: "0 2px 15px rgba(0,0,0,0.6)",
                  }}>
                    {track.title}
                  </div>
                  <div style={{
                    fontSize: 24, color: "rgba(255,255,255,0.6)",
                    fontFamily: FONT, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: 4, marginTop: 6,
                  }}>
                    {track.artist}
                  </div>
                </div>
              </div>

              {/* ========== DECODED COUNTER ========== */}
              <div style={{
                position: "absolute", top: 185, left: 0, right: 0,
                display: "flex", justifyContent: "center", alignItems: "center",
                padding: "25px 0", zIndex: 10,
              }}>
                <div style={{
                  background: `linear-gradient(135deg, ${HL}, ${HL}dd)`,
                  borderRadius: 16, padding: "18px 50px",
                  display: "flex", alignItems: "baseline", gap: 14,
                  boxShadow: `0 0 50px ${HL}50, 0 8px 35px rgba(0,0,0,0.4)`,
                  transform: `scale(${0.95 + counterPop * 0.05})`,
                }}>
                  <div style={{
                    fontSize: 80, fontWeight: 900, color: "#000",
                    fontFamily: FONT, lineHeight: 1,
                    letterSpacing: 2,
                  }}>
                    {decodedTerms}/{totalTerms}
                  </div>
                  <div style={{
                    fontSize: 24, color: "rgba(0,0,0,0.5)",
                    fontFamily: FONT, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: 3,
                  }}>
                    DÉCODÉS
                  </div>
                </div>
              </div>

              {/* ========== SIDE-BY-SIDE: LYRICS | DECODE ========== */}
              <div style={{
                position: "absolute", top: 350, left: 0, right: 0, bottom: 20,
                display: "flex", flexDirection: "row",
              }}>
                {/* ====== LEFT: PAROLES ====== */}
                <div style={{
                  width: "52%", padding: "15px 10px 15px 30px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  overflow: "hidden", position: "relative",
                }}>
                  {/* Fade top */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 50,
                    background: `linear-gradient(180deg, ${BG_BASE}ff 0%, transparent 100%)`,
                    zIndex: 5, pointerEvents: "none",
                  }} />

                  {/* Lyrics */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 14,
                    transform: `translateY(${
                      activeLineIndex > 0 ? -(activeLineIndex * 130 - 50) : 0
                    }px)`,
                    transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                    {lyrics.map((line, index) => {
                      const isActive = index === activeLineIndex;
                      const isPast = currentTime >= line.endTime;
                      const progress = isActive ? getLineProgress(line) : 0;

                      let opacity = 0.08;
                      if (isActive) opacity = 1;
                      else if (isPast) opacity = 0.2;
                      else if (index === activeLineIndex + 1) opacity = 0.12;

                      const lineScale = isActive
                        ? spring({
                            frame: Math.max(0, contentFrame - line.startTime * fps),
                            fps,
                            config: { damping: 8, stiffness: 280, mass: 0.3 },
                          })
                        : 0.88;

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
                              <span key={`pre-${i}`}>{line.text.slice(lastIdx, tIdx)}</span>
                            );
                          }
                          elements.push(
                            <span
                              key={`term-${i}`}
                              style={{
                                color: "#000",
                                fontWeight: 900,
                                background: HL,
                                padding: "4px 12px",
                                borderRadius: 5,
                                marginLeft: 4, marginRight: 4,
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
                          elements.push(<span key="rest">{line.text.slice(lastIdx)}</span>);
                        }
                        return elements.length > 0 ? elements : line.text;
                      };

                      return (
                        <div
                          key={line.id}
                          style={{
                            opacity,
                            transform: `scale(${lineScale})`,
                            transformOrigin: "left center",
                            transition: "opacity 0.2s ease",
                            padding: "14px 0",
                            position: "relative",
                            minHeight: 100,
                          }}
                        >
                          {isActive && (
                            <div style={{
                              position: "absolute", left: -4, top: 8, bottom: 8,
                              width: 5, borderRadius: 0,
                              background: `linear-gradient(180deg, ${HL}, ${ACCENT})`,
                              boxShadow: `0 0 18px ${HL}80`,
                            }} />
                          )}
                          <div style={{
                            fontSize: 44,
                            fontWeight: 900,
                            color: isPast ? "rgba(255,255,255,0.15)" : "#ffffff",
                            fontFamily: FONT,
                            textTransform: "uppercase",
                            lineHeight: 1.3,
                            letterSpacing: 1.5,
                            paddingLeft: isActive ? 18 : 8,
                            textShadow: isActive ? "0 2px 12px rgba(0,0,0,0.6)" : "none",
                          }}>
                            {renderText()}
                          </div>

                          {isActive && (
                            <div style={{
                              marginTop: 12, marginLeft: 18,
                              height: 5, borderRadius: 3,
                              background: "rgba(255,255,255,0.08)",
                              overflow: "hidden", width: "85%",
                            }}>
                              <div style={{
                                width: `${progress * 100}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${HL}, ${ACCENT})`,
                                boxShadow: `0 0 12px ${HL}80`,
                                borderRadius: 3,
                              }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fade bottom */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
                    background: `linear-gradient(0deg, ${BG_BASE}ff 0%, transparent 100%)`,
                    zIndex: 5, pointerEvents: "none",
                  }} />
                </div>

                {/* ====== DIVIDER ====== */}
                <div style={{
                  width: 4,
                  background: `linear-gradient(180deg, transparent, ${ACCENT}60 20%, ${HL}50 50%, ${ACCENT}60 80%, transparent)`,
                  margin: "30px 0",
                }} />

                {/* ====== RIGHT: DECODE ====== */}
                <div style={{
                  flex: 1, padding: "15px 30px 15px 18px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  gap: 24, overflow: "hidden",
                }}>
                  {currentTerms.length > 0 ? (
                    currentTerms.map((term, i) => {
                      const tFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                      // Card slide-in
                      const s = spring({
                        frame: Math.max(0, tFrame - i * 3),
                        fps,
                        config: { damping: 8, stiffness: 250, mass: 0.4 },
                      });
                      // Term slam
                      const termSlam = spring({
                        frame: Math.max(0, tFrame - i * 3 - 2),
                        fps,
                        config: { damping: 5, stiffness: 200, mass: 0.6 },
                      });

                      // Definition typewriter
                      const defDelay = 8 + i * 3;
                      const defProgress = Math.max(0, tFrame - defDelay);
                      const charsToShow = Math.min(
                        Math.floor(defProgress * 2.2),
                        term.definition.length,
                      );
                      const visibleDef = term.definition.slice(0, charsToShow);
                      const showCursor = charsToShow < term.definition.length && defProgress > 0;
                      const defDone = charsToShow >= term.definition.length && defProgress > 0;

                      // "TU SAVAIS ?" flash after definition complete
                      const tuSavaisFrame = defDone ? Math.max(0, tFrame - defDelay - Math.ceil(term.definition.length / 2.2) - 2) : 0;
                      const tuSavaisScale = spring({
                        frame: tuSavaisFrame,
                        fps,
                        config: { damping: 8, stiffness: 300, mass: 0.3 },
                      });

                      // Glow pulse
                      const glowPulse = Math.sin(frame * 0.08 + i * 2) * 0.4 + 0.6;

                      return (
                        <div
                          key={`expl-${term.term}-${i}`}
                          style={{ position: "relative" }}
                        >
                          {/* Glow behind card */}
                          <div style={{
                            position: "absolute", inset: -15,
                            borderRadius: 18,
                            background: `radial-gradient(ellipse at left, ${HL}30 0%, transparent 70%)`,
                            opacity: s * glowPulse,
                            filter: "blur(20px)",
                            pointerEvents: "none",
                          }} />

                          <div
                            style={{
                              position: "relative",
                              background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)`,
                              borderRadius: 14,
                              padding: "26px 24px",
                              borderLeft: `5px solid ${HL}`,
                              transform: `translateX(${(1 - s) * 80}px) scale(${0.85 + s * 0.15})`,
                              opacity: s,
                              boxShadow: `0 4px 30px rgba(0,0,0,0.3), -5px 0 25px ${HL}20, 0 0 60px ${HL}08`,
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            {term.category && (
                              <div style={{
                                display: "inline-block", marginBottom: 14,
                                background: getCategoryColor(term.category),
                                color: "#000", fontSize: 22, fontWeight: 900,
                                padding: "8px 18px", borderRadius: 6,
                                fontFamily: FONT, letterSpacing: 3,
                                textTransform: "uppercase",
                                boxShadow: `0 3px 15px ${getCategoryColor(term.category)}50`,
                              }}>
                                {getCategoryLabel(term.category)}
                              </div>
                            )}

                            {/* Term — slam entrance */}
                            <div style={{
                              fontSize: 52, fontWeight: 900, color: HL,
                              fontFamily: FONT,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              textShadow: `0 0 25px ${HL}70, 0 2px 10px rgba(0,0,0,0.5)`,
                              marginBottom: 12, lineHeight: 1.1,
                              transform: `scale(${0.6 + termSlam * 0.4})`,
                              opacity: termSlam,
                            }}>
                              {term.term}
                            </div>

                            {/* Separator line */}
                            <div style={{
                              width: `${s * 100}%`, height: 2,
                              background: `linear-gradient(90deg, ${HL}80, transparent)`,
                              marginBottom: 12, borderRadius: 1,
                            }} />

                            {/* Definition — typewriter */}
                            <div style={{
                              fontSize: 30, color: "rgba(255,255,255,0.92)",
                              fontFamily: FONT, fontWeight: 400,
                              lineHeight: 1.4, minHeight: 42,
                            }}>
                              {visibleDef}
                              {showCursor && (
                                <span style={{
                                  color: HL,
                                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                                  fontWeight: 900,
                                }}>|</span>
                              )}
                            </div>

                            {/* "TU SAVAIS ?" flash */}
                            {defDone && tuSavaisFrame > 0 && (
                              <div style={{
                                marginTop: 10,
                                transform: `scale(${tuSavaisScale})`,
                                opacity: tuSavaisScale,
                              }}>
                                <span style={{
                                  fontSize: 24, fontWeight: 900,
                                  color: HL,
                                  fontFamily: FONT,
                                  letterSpacing: 4,
                                  textTransform: "uppercase",
                                  textShadow: `0 0 15px ${HL}60`,
                                }}>
                                  TU SAVAIS ?
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Smiley when no terms to decode (too easy!)
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 130,
                        opacity: 0.4 + fastPulse * 0.3,
                        filter: `drop-shadow(0 0 30px ${ACCENT}40)`,
                        transform: `scale(${0.95 + fastPulse * 0.1})`,
                      }}>
                        😎
                      </div>
                      <div style={{
                        fontSize: 30, color: "rgba(255,255,255,0.6)",
                        fontFamily: FONT, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: 5,
                        marginTop: 12,
                      }}>
                        TROP FACILE
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </AbsoluteFill>
      </Sequence>

      {/* ========== AUDIO - starts after hook, synced with lyrics ========== */}
      {track.audioFile && (() => {
        const audioOffset = track.audioStartOffset ?? 0;
        const startFromFrames = Math.round(audioOffset * fps);
        return (
          <Sequence from={hookDurationFrames}>
            <Audio
              src={staticFile(track.audioFile)}
              startFrom={startFromFrames}
            />
          </Sequence>
        );
      })()}
    </AbsoluteFill>
  );
};
