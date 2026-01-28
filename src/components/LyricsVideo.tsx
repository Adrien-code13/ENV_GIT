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
  const BG1 = style.backgroundColor;
  const BG2 = style.secondaryColor ?? "#1c1c1c";

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
    // If active line has terms and we're past the initial delay, show them
    if (activeLine && activeLine.terms.length > 0) {
      const progress = getLineProgress(activeLine);
      if (progress >= 0.05) {
        return { currentTerms: activeLine.terms, hasTermsToShow: true };
      }
    }

    // Otherwise, find the most recent line with terms
    for (let i = activeLineIndex; i >= 0; i--) {
      const line = lyrics[i];
      if (line && line.terms.length > 0 && currentTime >= line.startTime) {
        return { currentTerms: line.terms, hasTermsToShow: true };
      }
    }

    // Check if current line exists but has no terms (show smiley)
    if (activeLine && activeLine.terms.length === 0) {
      return { currentTerms: [], hasTermsToShow: false };
    }

    return { currentTerms: [], hasTermsToShow: false };
  }, [activeLine, activeLineIndex, lyrics, currentTime]);

  // === ANIMATIONS ===
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
  const drift = Math.sin(frame * 0.01) * 20;

  // Counter animation when it changes
  const counterScale = spring({
    frame: frame % 30,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.5 },
  });

  // End screen animations
  const endScreenProgress = isEndScreen ? (currentTime - lyricsEndTime) / endScreenDuration : 0;
  const endScreenScale = spring({
    frame: isEndScreen ? Math.floor((currentTime - lyricsEndTime) * fps) : 0,
    fps,
    config: { damping: 8, stiffness: 120, mass: 0.6 },
  });
  const questionMarkBounce = Math.sin(frame * 0.1) * 10;

  // Category styling
  const getCategoryColor = (cat?: string) => {
    const colors: Record<string, string> = {
      argot: "#ff3333", verlan: "#bb44ff", reference: "#ffaa00",
      anglicisme: "#00ccff", expression: "#ff6600",
    };
    return colors[cat ?? ""] ?? "#888";
  };
  const getCategoryLabel = (cat?: string) => {
    const labels: Record<string, string> = {
      argot: "ARGOT", verlan: "VERLAN", reference: "REF",
      anglicisme: "ANGL.", expression: "EXPR.",
    };
    return labels[cat ?? ""] ?? "TERME";
  };

  // Street-style fonts
  const FONT_LYRICS = "'Impact', 'Arial Black', 'Bebas Neue', sans-serif";
  const FONT_UI = "'Inter', 'Helvetica Neue', sans-serif";

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* ========== HOOK SCREEN ========== */}
      {hook && (
        <Sequence from={0} durationInFrames={hookDurationFrames}>
          <HookScreen hook={hook} style={style} />
        </Sequence>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <Sequence from={hookDurationFrames}>
        <AbsoluteFill>
          {/* --- Background gradient --- */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(175deg,
              ${BG1} 0%, ${BG2} 35%, #0d0d0d 65%, ${BG1} 100%)`,
          }} />

          {/* --- Optional background image --- */}
          {style.backgroundImage && (
            <div style={{
              position: "absolute", inset: 0, opacity: 0.18,
              filter: "brightness(0.4) contrast(1.3) saturate(0.6)",
              overflow: "hidden",
            }}>
              <Img
                src={staticFile(style.backgroundImage)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* --- Grunge texture overlay --- */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage:
              "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==)",
            backgroundSize: "200px",
            transform: `translate(${drift}px, ${drift * 0.5}px)`,
          }} />

          {/* --- Street glow --- */}
          <div style={{
            position: "absolute", top: -100, left: "30%",
            width: 400, height: 800,
            background: `linear-gradient(180deg, ${HL}12 0%, transparent 60%)`,
            opacity: pulse, filter: "blur(40px)",
            transform: "skewX(-15deg)",
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
                width: 800,
                height: 800,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${HL}50 0%, transparent 70%)`,
                opacity: pulse,
                filter: "blur(60px)",
              }} />

              {/* Main text */}
              <div style={{
                transform: `scale(${endScreenScale})`,
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: FONT_LYRICS,
                  textTransform: "uppercase",
                  letterSpacing: 4,
                  textShadow: "0 4px 30px rgba(0,0,0,0.8)",
                  marginBottom: 30,
                }}>
                  ALORS, TU EN AVAIS
                </div>
                <div style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#ffffff",
                  fontFamily: FONT_LYRICS,
                  textTransform: "uppercase",
                  letterSpacing: 4,
                  textShadow: "0 4px 30px rgba(0,0,0,0.8)",
                  marginBottom: 50,
                }}>
                  COMBIEN
                </div>

                {/* Giant question mark */}
                <div style={{
                  fontSize: 280,
                  fontWeight: 900,
                  color: HL,
                  fontFamily: FONT_LYRICS,
                  textShadow: `0 0 80px ${HL}90, 0 0 150px ${HL}50`,
                  transform: `translateY(${questionMarkBounce}px)`,
                  lineHeight: 0.8,
                }}>
                  ?
                </div>

                {/* Score reminder */}
                <div style={{
                  marginTop: 50,
                  fontSize: 48,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT_UI,
                  fontWeight: 600,
                }}>
                  {decodedTerms}/{totalTerms} décodés
                </div>
              </div>
            </AbsoluteFill>
          ) : (
            <>
              {/* ========== TOP HEADER — BIGGER ========== */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                padding: "60px 35px 25px", zIndex: 10,
                display: "flex", alignItems: "center", gap: 22,
              }}>
                {/* Cover art */}
                {track.coverImage && (
                  <div style={{
                    width: 100, height: 100, borderRadius: 10, overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: `0 0 0 4px ${HL}, 0 4px 30px rgba(0,0,0,0.8)`,
                  }}>
                    <Img
                      src={staticFile(track.coverImage)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Title — BIGGER */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 52, fontWeight: 900, color: "#fff",
                    fontFamily: FONT_LYRICS,
                    textTransform: "uppercase", letterSpacing: 3, lineHeight: 1.1,
                    textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                  }}>
                    {track.title}
                  </div>
                  <div style={{
                    fontSize: 28, color: "rgba(255,255,255,0.5)",
                    fontFamily: FONT_UI, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: 5, marginTop: 8,
                  }}>
                    {track.artist}
                  </div>
                </div>
              </div>

              {/* ========== GIANT DECODED COUNTER — EVEN BIGGER ========== */}
              <div style={{
                position: "absolute", top: 200, left: 0, right: 0,
                display: "flex", justifyContent: "center", alignItems: "center",
                padding: "30px 0", zIndex: 10,
              }}>
                <div style={{
                  background: HL,
                  borderRadius: 14, padding: "22px 60px",
                  display: "flex", alignItems: "baseline", gap: 18,
                  boxShadow: `0 0 60px ${HL}70, 0 10px 40px rgba(0,0,0,0.6)`,
                  transform: `scale(${0.95 + counterScale * 0.05})`,
                }}>
                  <div style={{
                    fontSize: 85, fontWeight: 900, color: "#000",
                    fontFamily: FONT_LYRICS, lineHeight: 1,
                    letterSpacing: 3,
                  }}>
                    {decodedTerms}/{totalTerms}
                  </div>
                  <div style={{
                    fontSize: 26, color: "rgba(0,0,0,0.5)",
                    fontFamily: FONT_UI, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: 4,
                  }}>
                    DÉCODÉS
                  </div>
                </div>
              </div>

              {/* ========== SIDE-BY-SIDE: LYRICS | DECODE ========== */}
              <div style={{
                position: "absolute", top: 380, left: 0, right: 0, bottom: 30,
                display: "flex", flexDirection: "row",
              }}>
                {/* ====== LEFT: PAROLES (no title) ====== */}
                <div style={{
                  width: "52%", padding: "20px 12px 20px 35px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  overflow: "hidden", position: "relative",
                }}>
                  {/* Fade top */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 60,
                    background: "linear-gradient(180deg, rgba(10,10,10,1) 0%, transparent 100%)",
                    zIndex: 5, pointerEvents: "none",
                  }} />

                  {/* Lyrics — BIGGER FONT */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 18,
                    transform: `translateY(${
                      activeLineIndex > 0 ? -(activeLineIndex * 140 - 60) : 0
                    }px)`,
                    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                    {lyrics.map((line, index) => {
                      const isActive = index === activeLineIndex;
                      const isPast = currentTime >= line.endTime;
                      const progress = isActive ? getLineProgress(line) : 0;

                      let opacity = 0.1;
                      if (isActive) opacity = 1;
                      else if (isPast) opacity = 0.2;
                      else if (index === activeLineIndex + 1) opacity = 0.12;

                      const lineScale = isActive
                        ? spring({
                            frame: Math.max(0, contentFrame - line.startTime * fps),
                            fps,
                            config: { damping: 12, stiffness: 220, mass: 0.4 },
                          })
                        : 0.9;

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
                                padding: "6px 14px",
                                borderRadius: 5,
                                marginLeft: 5, marginRight: 5,
                                boxShadow: `0 0 25px ${HL}80`,
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
                            transition: "opacity 0.25s ease",
                            padding: "16px 0",
                            position: "relative",
                            minHeight: 110,
                          }}
                        >
                          {isActive && (
                            <div style={{
                              position: "absolute", left: -5, top: 10, bottom: 10,
                              width: 6, borderRadius: 0,
                              background: HL,
                              boxShadow: `0 0 20px ${HL}90`,
                            }} />
                          )}
                          <div style={{
                            fontSize: 46,
                            fontWeight: 900,
                            color: isPast ? "rgba(255,255,255,0.15)" : "#ffffff",
                            fontFamily: FONT_LYRICS,
                            textTransform: "uppercase",
                            lineHeight: 1.35,
                            letterSpacing: 2,
                            paddingLeft: isActive ? 20 : 10,
                            textShadow: isActive ? `0 2px 15px rgba(0,0,0,0.8)` : "none",
                          }}>
                            {renderText()}
                          </div>

                          {isActive && (
                            <div style={{
                              marginTop: 14, marginLeft: 20,
                              height: 6, borderRadius: 0,
                              background: "rgba(255,255,255,0.05)",
                              overflow: "hidden", width: "80%",
                            }}>
                              <div style={{
                                width: `${progress * 100}%`,
                                height: "100%",
                                background: HL,
                                boxShadow: `0 0 15px ${HL}90`,
                              }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fade bottom */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                    background: "linear-gradient(0deg, rgba(10,10,10,1) 0%, transparent 100%)",
                    zIndex: 5, pointerEvents: "none",
                  }} />
                </div>

                {/* ====== DIVIDER ====== */}
                <div style={{
                  width: 5,
                  background: `linear-gradient(180deg, transparent, ${HL}60 20%, ${HL}60 80%, transparent)`,
                  margin: "40px 0",
                }} />

                {/* ====== RIGHT: DECODE (no title) — BIGGER ====== */}
                <div style={{
                  flex: 1, padding: "20px 35px 20px 20px",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  gap: 28, overflow: "hidden",
                }}>
                  {currentTerms.length > 0 ? (
                    currentTerms.map((term, i) => {
                      const tFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                      const s = spring({
                        frame: Math.max(0, tFrame - i * 4),
                        fps,
                        config: { damping: 10, stiffness: 200, mass: 0.5 },
                      });

                      return (
                        <div
                          key={`expl-${term.term}-${i}`}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 8,
                            padding: "30px 28px",
                            borderLeft: `6px solid ${HL}`,
                            transform: `translateX(${(1 - s) * 50}px)`,
                            opacity: s,
                            boxShadow: `0 5px 35px rgba(0,0,0,0.5), -6px 0 25px ${HL}25`,
                          }}
                        >
                          {term.category && (
                            <div style={{
                              display: "inline-block", marginBottom: 16,
                              background: getCategoryColor(term.category),
                              color: "#000", fontSize: 15, fontWeight: 900,
                              padding: "8px 16px", borderRadius: 4,
                              fontFamily: FONT_UI, letterSpacing: 2,
                              textTransform: "uppercase",
                              boxShadow: `0 2px 15px ${getCategoryColor(term.category)}60`,
                            }}>
                              {getCategoryLabel(term.category)}
                            </div>
                          )}

                          <div style={{
                            fontSize: 52, fontWeight: 900, color: HL,
                            fontFamily: FONT_LYRICS,
                            textTransform: "uppercase",
                            letterSpacing: 3,
                            textShadow: `0 0 25px ${HL}80`,
                            marginBottom: 14, lineHeight: 1.1,
                          }}>
                            {term.term}
                          </div>

                          <div style={{
                            fontSize: 32, color: "rgba(255,255,255,0.85)",
                            fontFamily: FONT_UI, fontWeight: 400,
                            lineHeight: 1.45,
                          }}>
                            {term.definition}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Smiley when no terms to decode (too easy!)
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 120,
                        opacity: 0.3 + pulse * 0.2,
                        filter: `drop-shadow(0 0 30px ${HL}40)`,
                      }}>
                        😎
                      </div>
                      <div style={{
                        fontSize: 28, color: "rgba(255,255,255,0.4)",
                        fontFamily: FONT_UI, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: 4,
                        marginTop: 15,
                      }}>
                        TROP FACILE
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========== AUDIO ========== */}
          {track.audioFile && <Audio src={staticFile(track.audioFile)} />}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
