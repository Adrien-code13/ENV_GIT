import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import type { RapLyricsVideo, LyricLine as LyricLineType } from "../types";
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

  // === COLORS ===
  const HL = style.highlightColor;
  const BG1 = style.backgroundColor;
  const BG2 = style.secondaryColor ?? "#1c1c1c";

  // === STATE ===
  const activeLine = useMemo(() => {
    if (isHookPhase) return null;
    return lyrics.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
  }, [lyrics, currentTime, isHookPhase]);

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

  const currentTerms = useMemo(() => {
    if (!activeLine || !activeLine.showExplanation) return [];
    const progress = getLineProgress(activeLine);
    if (progress < 0.2) return [];
    return activeLine.terms;
  }, [activeLine, currentTime]);

  // === ANIMATIONS ===
  const videoProgress = frame / durationInFrames;
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
  // Slow drift for background grain
  const drift = Math.sin(frame * 0.01) * 20;

  // Category styling — street colors
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

  // Street-style font: bold condensed
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
          {/* --- Dark concrete/urban gradient background --- */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(175deg,
              ${BG1} 0%, ${BG2} 35%, #0d0d0d 65%, ${BG1} 100%)`,
          }} />

          {/* --- Optional background image (city, street, etc.) --- */}
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

          {/* --- Grunge texture overlay (scratchy concrete feel) --- */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage:
              "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==)",
            backgroundSize: "200px",
            transform: `translate(${drift}px, ${drift * 0.5}px)`,
          }} />

          {/* --- Diagonal scratch lines (urban/gritty) --- */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.02,
            background: `repeating-linear-gradient(
              -45deg,
              transparent, transparent 80px,
              rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 81px
            )`,
          }} />

          {/* --- Street glow: harsh, directional, not soft orbs --- */}
          <div style={{
            position: "absolute", top: -100, left: "30%",
            width: 400, height: 800, borderRadius: "0%",
            background: `linear-gradient(180deg, ${HL}12 0%, transparent 60%)`,
            opacity: pulse, filter: "blur(40px)",
            transform: "skewX(-15deg)",
          }} />

          {/* ========== TOP HEADER — raw/minimal ========== */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "50px 28px 16px", zIndex: 10,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            {/* Cover art with rough border */}
            {track.coverImage && (
              <div style={{
                width: 70, height: 70, borderRadius: 6, overflow: "hidden",
                flexShrink: 0,
                boxShadow: `0 0 0 3px ${HL}, 0 4px 20px rgba(0,0,0,0.8)`,
              }}>
                <Img
                  src={staticFile(track.coverImage)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Title — UPPERCASE, condensed, street */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 32, fontWeight: 900, color: "#fff",
                fontFamily: FONT_LYRICS,
                textTransform: "uppercase", letterSpacing: 2, lineHeight: 1.1,
                textShadow: "0 2px 15px rgba(0,0,0,0.8)",
              }}>
                {track.title}
              </div>
              <div style={{
                fontSize: 18, color: "rgba(255,255,255,0.45)",
                fontFamily: FONT_UI, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: 3, marginTop: 4,
              }}>
                {track.artist}
              </div>
            </div>

            {/* COUNTER — raw box style */}
            <div style={{
              background: HL,
              borderRadius: 4, padding: "10px 14px",
              display: "flex", flexDirection: "column", alignItems: "center",
              boxShadow: `0 0 25px ${HL}50, 0 4px 15px rgba(0,0,0,0.5)`,
            }}>
              <div style={{
                fontSize: 30, fontWeight: 900, color: "#000",
                fontFamily: FONT_LYRICS, lineHeight: 1,
                letterSpacing: 1,
              }}>
                {decodedTerms}/{totalTerms}
              </div>
              <div style={{
                fontSize: 9, color: "rgba(0,0,0,0.6)",
                fontFamily: FONT_UI, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: 2, marginTop: 3,
              }}>
                DECODED
              </div>
            </div>
          </div>

          {/* --- Header divider — thick, raw --- */}
          <div style={{
            position: "absolute", top: 155, left: 28, right: 28, height: 3,
            background: `linear-gradient(90deg, ${HL}, ${HL}60, transparent)`,
          }} />

          {/* ========== SIDE-BY-SIDE ========== */}
          <div style={{
            position: "absolute", top: 175, left: 0, right: 0, bottom: 125,
            display: "flex", flexDirection: "row",
          }}>
            {/* ====== LEFT: PAROLES ====== */}
            <div style={{
              width: "52%", padding: "28px 10px 28px 28px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              overflow: "hidden", position: "relative",
            }}>
              {/* Column tag — spray paint style */}
              <div style={{
                position: "absolute", top: 6, left: 28,
                fontSize: 12, fontWeight: 900, color: HL,
                fontFamily: FONT_UI, letterSpacing: 4,
                textTransform: "uppercase", zIndex: 10,
                opacity: 0.6,
              }}>
                PAROLES
              </div>

              {/* Fade top */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 80,
                background: "linear-gradient(180deg, rgba(10,10,10,1) 0%, transparent 100%)",
                zIndex: 5, pointerEvents: "none",
              }} />

              {/* Lyrics */}
              <div style={{
                display: "flex", flexDirection: "column", gap: 10,
                transform: `translateY(${
                  activeLineIndex > 0 ? -(activeLineIndex * 95 - 60) : 0
                }px)`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}>
                {lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPast = currentTime >= line.endTime;
                  const progress = isActive ? getLineProgress(line) : 0;

                  let opacity = 0.12;
                  if (isActive) opacity = 1;
                  else if (isPast) opacity = 0.25;
                  else if (index === activeLineIndex + 1) opacity = 0.15;

                  const lineScale = isActive
                    ? spring({
                        frame: Math.max(0, contentFrame - line.startTime * fps),
                        fps,
                        config: { damping: 12, stiffness: 220, mass: 0.4 },
                      })
                    : 0.93;

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
                            padding: "2px 8px",
                            borderRadius: 3,
                            marginLeft: 3, marginRight: 3,
                            boxShadow: `0 0 15px ${HL}60`,
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
                        padding: "10px 0",
                        position: "relative",
                      }}
                    >
                      {/* Active indicator — thick bar */}
                      {isActive && (
                        <div style={{
                          position: "absolute", left: -2, top: 4, bottom: 4,
                          width: 4, borderRadius: 0,
                          background: HL,
                          boxShadow: `0 0 12px ${HL}80`,
                        }} />
                      )}
                      <div style={{
                        fontSize: 30,
                        fontWeight: 900,
                        color: isPast ? "rgba(255,255,255,0.2)" : "#ffffff",
                        fontFamily: FONT_LYRICS,
                        textTransform: "uppercase",
                        lineHeight: 1.4,
                        letterSpacing: 1.5,
                        paddingLeft: isActive ? 14 : 6,
                        textShadow: isActive
                          ? `0 2px 10px rgba(0,0,0,0.7)`
                          : "none",
                      }}>
                        {renderText()}
                      </div>

                      {/* Progress bar — thick, solid */}
                      {isActive && (
                        <div style={{
                          marginTop: 8, marginLeft: 14,
                          height: 4, borderRadius: 0,
                          background: "rgba(255,255,255,0.06)",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${progress * 100}%`,
                            height: "100%",
                            background: HL,
                            boxShadow: `0 0 10px ${HL}80`,
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Fade bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
                background: "linear-gradient(0deg, rgba(10,10,10,1) 0%, transparent 100%)",
                zIndex: 5, pointerEvents: "none",
              }} />
            </div>

            {/* ====== DIVIDER — raw line ====== */}
            <div style={{
              width: 3,
              background: `linear-gradient(180deg, transparent, ${HL}40 20%, ${HL}40 80%, transparent)`,
              margin: "40px 0",
            }} />

            {/* ====== RIGHT: DECODE ====== */}
            <div style={{
              flex: 1, padding: "28px 28px 28px 14px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              gap: 20, overflow: "hidden",
            }}>
              {/* Column tag */}
              <div style={{
                position: "absolute", top: 6, right: 28,
                fontSize: 12, fontWeight: 900, color: HL,
                fontFamily: FONT_UI, letterSpacing: 4,
                textTransform: "uppercase", opacity: 0.6,
              }}>
                DECODE
              </div>

              {currentTerms.length > 0 ? (
                currentTerms.map((term, i) => {
                  const tFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                  const s = spring({
                    frame: Math.max(0, tFrame - i * 5 - 6),
                    fps,
                    config: { damping: 10, stiffness: 200, mass: 0.5 },
                  });

                  return (
                    <div
                      key={`expl-${term.term}-${i}`}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 4,
                        padding: "20px 20px",
                        borderLeft: `4px solid ${HL}`,
                        transform: `translateX(${(1 - s) * 60}px)`,
                        opacity: s,
                        boxShadow: `0 4px 25px rgba(0,0,0,0.5), -4px 0 15px ${HL}15`,
                      }}
                    >
                      {/* Category badge — street tag style */}
                      {term.category && (
                        <div style={{
                          display: "inline-block", marginBottom: 10,
                          background: getCategoryColor(term.category),
                          color: "#000", fontSize: 11, fontWeight: 900,
                          padding: "4px 10px", borderRadius: 2,
                          fontFamily: FONT_UI, letterSpacing: 2,
                          textTransform: "uppercase",
                          boxShadow: `0 2px 10px ${getCategoryColor(term.category)}50`,
                        }}>
                          {getCategoryLabel(term.category)}
                        </div>
                      )}

                      {/* Term — BIG CAPS */}
                      <div style={{
                        fontSize: 36, fontWeight: 900, color: HL,
                        fontFamily: FONT_LYRICS,
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        textShadow: `0 0 15px ${HL}60`,
                        marginBottom: 8, lineHeight: 1.1,
                      }}>
                        {term.term}
                      </div>

                      {/* Definition */}
                      <div style={{
                        fontSize: 22, color: "rgba(255,255,255,0.75)",
                        fontFamily: FONT_UI, fontWeight: 400,
                        lineHeight: 1.5,
                      }}>
                        {term.definition}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 50, color: HL,
                    fontFamily: FONT_LYRICS,
                    textTransform: "uppercase",
                    opacity: 0.1 + pulse * 0.12,
                    textShadow: `0 0 30px ${HL}30`,
                    letterSpacing: 5,
                  }}>
                    ???
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== BOTTOM BAR ========== */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 115, padding: "0 28px 42px",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10,
          }}>
            {/* Progress bar — thick, raw */}
            <div style={{
              width: "100%", height: 6, borderRadius: 0,
              backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
            }}>
              <div style={{
                width: `${videoProgress * 100}%`, height: "100%",
                background: HL,
                boxShadow: `0 0 15px ${HL}70, 0 0 5px ${HL}`,
              }} />
            </div>

            {/* Bottom bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{
                fontSize: 14, fontWeight: 900,
                color: "rgba(255,255,255,0.3)",
                fontFamily: FONT_UI,
                letterSpacing: 3, textTransform: "uppercase",
              }}>
                LYRICS DECODED
              </div>
              <div style={{
                fontSize: 14, fontWeight: 900, color: HL,
                fontFamily: FONT_UI,
                letterSpacing: 1,
                textShadow: `0 0 10px ${HL}50`,
              }}>
                FOLLOW +
              </div>
            </div>
          </div>

          {/* ========== AUDIO ========== */}
          {track.audioFile && <Audio src={staticFile(track.audioFile)} />}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
