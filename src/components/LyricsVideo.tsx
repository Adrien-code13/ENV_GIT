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

  // === CUSTOMIZABLE COLORS (change in JSON "style" section) ===
  const HL = style.highlightColor;        // accent color for terms
  const BG1 = style.backgroundColor;      // main background
  const BG2 = style.secondaryColor ?? "#1a0a2e"; // gradient second color

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
  const gradientAngle = interpolate(frame, [0, durationInFrames], [120, 300]);
  const videoProgress = frame / durationInFrames;
  // Breathing pulse for glow effects
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  // Category styling
  const getCategoryColor = (cat?: string) => {
    const colors: Record<string, string> = {
      argot: "#ff4757", verlan: "#c44dff", reference: "#3b82f6",
      anglicisme: "#00d4aa", expression: "#ffa502",
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

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ========== HOOK SCREEN (2.5s) ========== */}
      {hook && (
        <Sequence from={0} durationInFrames={hookDurationFrames}>
          <HookScreen hook={hook} style={style} />
        </Sequence>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <Sequence from={hookDurationFrames}>
        <AbsoluteFill>
          {/* --- Background: animated gradient --- */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${gradientAngle}deg,
                ${BG1} 0%, ${BG2} 45%, #0a0a1a 100%)`,
            }}
          />

          {/* --- Optional background image --- */}
          {style.backgroundImage && (
            <div style={{
              position: "absolute", inset: 0, opacity: 0.12,
              filter: "blur(12px) brightness(0.5) saturate(1.4)",
              overflow: "hidden",
            }}>
              <Img
                src={staticFile(style.backgroundImage)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* --- Ambient glow orbs (TikTok-style visual interest) --- */}
          <div style={{
            position: "absolute",
            top: "20%", left: "-10%",
            width: 500, height: 500, borderRadius: "50%",
            background: `radial-gradient(circle, ${HL}18 0%, transparent 70%)`,
            opacity: pulse, filter: "blur(60px)",
          }} />
          <div style={{
            position: "absolute",
            bottom: "15%", right: "-15%",
            width: 600, height: 600, borderRadius: "50%",
            background: `radial-gradient(circle, ${BG2}30 0%, transparent 70%)`,
            opacity: 0.5 + pulse * 0.3, filter: "blur(80px)",
          }} />

          {/* ========== TOP HEADER ========== */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "55px 32px 18px", zIndex: 10,
            display: "flex", alignItems: "center", gap: 18,
          }}>
            {/* Cover art */}
            {track.coverImage && (
              <div style={{
                width: 72, height: 72, borderRadius: 14, overflow: "hidden",
                flexShrink: 0,
                boxShadow: `0 0 20px ${HL}30, 0 4px 15px rgba(0,0,0,0.6)`,
                border: `2px solid ${HL}40`,
              }}>
                <Img
                  src={staticFile(track.coverImage)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Title + Artist */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 30, fontWeight: 900, color: "#fff",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: -0.5, lineHeight: 1.2,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}>
                {track.title}
              </div>
              <div style={{
                fontSize: 20, color: "rgba(255,255,255,0.55)",
                fontFamily: "'Inter', sans-serif", fontWeight: 500,
                marginTop: 2,
              }}>
                {track.artist}
              </div>
            </div>

            {/* GAMIFIED COUNTER — makes people want to watch till end */}
            <div style={{
              background: `linear-gradient(135deg, ${HL}25, ${HL}08)`,
              border: `2px solid ${HL}50`,
              borderRadius: 18, padding: "10px 16px",
              display: "flex", flexDirection: "column", alignItems: "center",
              boxShadow: `0 0 20px ${HL}20`,
            }}>
              <div style={{
                fontSize: 28, fontWeight: 900, color: HL,
                fontFamily: "'Inter', sans-serif", lineHeight: 1,
                textShadow: `0 0 15px ${HL}60`,
              }}>
                {decodedTerms}/{totalTerms}
              </div>
              <div style={{
                fontSize: 10, color: "rgba(255,255,255,0.5)",
                fontFamily: "'Inter', sans-serif", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 2, marginTop: 4,
              }}>
                DECODED
              </div>
            </div>
          </div>

          {/* --- Header divider with glow --- */}
          <div style={{
            position: "absolute", top: 160, left: 32, right: 32, height: 2,
            background: `linear-gradient(90deg, transparent, ${HL}30, transparent)`,
            boxShadow: `0 0 8px ${HL}15`,
          }} />

          {/* ========== SIDE-BY-SIDE: LYRICS | DECODE ========== */}
          <div style={{
            position: "absolute", top: 180, left: 0, right: 0, bottom: 130,
            display: "flex", flexDirection: "row",
          }}>
            {/* ====== LEFT COLUMN: LYRICS ====== */}
            <div style={{
              width: "52%", padding: "24px 12px 24px 32px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              overflow: "hidden", position: "relative",
            }}>
              {/* Column label */}
              <div style={{
                position: "absolute", top: 8, left: 32,
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 3, textTransform: "uppercase", zIndex: 10,
              }}>
                PAROLES
              </div>

              {/* Fade top */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 70,
                background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
                zIndex: 5, pointerEvents: "none",
              }} />

              {/* Scrolling lyrics */}
              <div style={{
                display: "flex", flexDirection: "column", gap: 14,
                transform: `translateY(${
                  activeLineIndex > 0 ? -(activeLineIndex * 90 - 70) : 0
                }px)`,
                transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}>
                {lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPast = currentTime >= line.endTime;
                  const progress = isActive ? getLineProgress(line) : 0;

                  let opacity = 0.15;
                  if (isActive) opacity = 1;
                  else if (isPast) opacity = 0.3;
                  else if (index === activeLineIndex + 1) opacity = 0.2;

                  // Active line scale bounce
                  const lineScale = isActive
                    ? spring({
                        frame: Math.max(0, contentFrame - line.startTime * fps),
                        fps,
                        config: { damping: 15, stiffness: 200, mass: 0.5 },
                      })
                    : 0.95;

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
                      // NEON GLOW on terms — TikTok style bold highlight
                      elements.push(
                        <span
                          key={`term-${i}`}
                          style={{
                            color: HL,
                            fontWeight: 900,
                            textShadow: `0 0 8px ${HL}, 0 0 20px ${HL}80, 0 0 40px ${HL}40`,
                            background: `${HL}15`,
                            padding: "2px 6px",
                            borderRadius: 6,
                            marginLeft: 2, marginRight: 2,
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
                        transition: "opacity 0.3s ease",
                        padding: "8px 0",
                      }}
                    >
                      {/* Active line indicator bar */}
                      {isActive && (
                        <div style={{
                          position: "absolute", left: 10, top: 0, bottom: 0,
                          width: 3, borderRadius: 3,
                          background: `linear-gradient(180deg, ${HL}, ${HL}40)`,
                          boxShadow: `0 0 10px ${HL}60`,
                        }} />
                      )}
                      <div style={{
                        fontSize: 32,
                        fontWeight: isActive ? 800 : 500,
                        color: isPast ? "rgba(255,255,255,0.25)" : "#ffffff",
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.5, paddingLeft: isActive ? 10 : 0,
                        textShadow: isActive ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
                      }}>
                        {renderText()}
                      </div>

                      {/* Karaoke progress underline */}
                      {isActive && (
                        <div style={{
                          marginTop: 6, marginLeft: isActive ? 10 : 0,
                          height: 3, borderRadius: 2,
                          background: "rgba(255,255,255,0.08)",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${progress * 100}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${HL}, ${HL}aa)`,
                            borderRadius: 2,
                            boxShadow: `0 0 8px ${HL}60`,
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Fade bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 70,
                background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
                zIndex: 5, pointerEvents: "none",
              }} />
            </div>

            {/* ====== VERTICAL DIVIDER with glow ====== */}
            <div style={{
              width: 2,
              background: `linear-gradient(180deg, transparent, ${HL}25 30%, ${HL}25 70%, transparent)`,
              margin: "30px 0",
              boxShadow: `0 0 6px ${HL}10`,
            }} />

            {/* ====== RIGHT COLUMN: EXPLANATIONS ====== */}
            <div style={{
              flex: 1, padding: "24px 32px 24px 16px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              gap: 18, overflow: "hidden",
            }}>
              {/* Column label */}
              <div style={{
                position: "absolute", top: 8, right: 32,
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 3, textTransform: "uppercase",
              }}>
                DECODE
              </div>

              {currentTerms.length > 0 ? (
                currentTerms.map((term, i) => {
                  const tFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                  const s = spring({
                    frame: Math.max(0, tFrame - i * 5 - 6),
                    fps,
                    config: { damping: 10, stiffness: 180, mass: 0.6 },
                  });

                  return (
                    <div
                      key={`expl-${term.term}-${i}`}
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))`,
                        backdropFilter: "blur(20px)",
                        borderRadius: 18,
                        padding: "20px 22px",
                        border: `1px solid ${HL}20`,
                        transform: `translateX(${(1 - s) * 50}px) scale(${0.85 + s * 0.15})`,
                        opacity: s,
                        boxShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 15px ${HL}08`,
                      }}
                    >
                      {/* Category badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        {term.category && (
                          <div style={{
                            background: `linear-gradient(135deg, ${getCategoryColor(term.category)}, ${getCategoryColor(term.category)}cc)`,
                            color: "#fff", fontSize: 11, fontWeight: 800,
                            padding: "4px 10px", borderRadius: 8,
                            fontFamily: "'Inter', sans-serif", letterSpacing: 1.5,
                            boxShadow: `0 2px 8px ${getCategoryColor(term.category)}40`,
                          }}>
                            {getCategoryLabel(term.category)}
                          </div>
                        )}
                      </div>

                      {/* Term — BIG and glowing */}
                      <div style={{
                        fontSize: 34, fontWeight: 900, color: HL,
                        fontFamily: "'Inter', sans-serif",
                        textShadow: `0 0 10px ${HL}80, 0 0 25px ${HL}40`,
                        marginBottom: 8, lineHeight: 1.2,
                      }}>
                        {term.term}
                      </div>

                      {/* Definition */}
                      <div style={{
                        fontSize: 24, color: "rgba(255,255,255,0.8)",
                        fontFamily: "'Inter', sans-serif", fontWeight: 400,
                        lineHeight: 1.5,
                      }}>
                        = {term.definition}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Waiting state — pulsing */
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 64, color: HL,
                    fontFamily: "'Inter', sans-serif",
                    opacity: 0.15 + pulse * 0.15,
                    textShadow: `0 0 30px ${HL}40`,
                  }}>
                    ?
                  </div>
                  <div style={{
                    fontSize: 15, color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    letterSpacing: 3, textTransform: "uppercase", marginTop: 10,
                    opacity: 0.5 + pulse * 0.3,
                  }}>
                    En attente...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== BOTTOM BAR ========== */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 120, padding: "0 32px 45px",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12,
          }}>
            {/* Thick progress bar — TikTok style */}
            <div style={{
              width: "100%", height: 5, borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden",
            }}>
              <div style={{
                width: `${videoProgress * 100}%`, height: "100%",
                background: `linear-gradient(90deg, ${HL}, ${HL}cc)`,
                borderRadius: 3,
                boxShadow: `0 0 12px ${HL}60, 0 0 4px ${HL}`,
              }} />
            </div>

            {/* Bottom CTA + branding */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{
                fontSize: 15, fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 2, textTransform: "uppercase",
              }}>
                LYRICS DECODED
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: HL,
                fontFamily: "'Inter', sans-serif",
                textShadow: `0 0 8px ${HL}40`,
              }}>
                Follow pour +
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
