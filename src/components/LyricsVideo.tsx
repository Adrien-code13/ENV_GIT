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

  // Colors from style (customizable via JSON)
  const highlight = style.highlightColor;
  const bgColor1 = style.backgroundColor;
  const bgColor2 = style.secondaryColor ?? "#1a0a2e";

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
        if (progress > 0.5) count += line.terms.length;
      }
    }
    return Math.min(count, totalTerms);
  }, [lyrics, currentTime, totalTerms, isHookPhase]);

  // Current terms for active line
  const currentTerms = useMemo(() => {
    if (!activeLine || !activeLine.showExplanation) return [];
    const progress = getLineProgress(activeLine);
    if (progress < 0.25) return [];
    return activeLine.terms;
  }, [activeLine, currentTime]);

  // Animated background
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 315]);
  const videoProgress = frame / durationInFrames;

  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case "argot": return "#ef4444";
      case "verlan": return "#a855f7";
      case "reference": return "#3b82f6";
      case "anglicisme": return "#22c55e";
      case "expression": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const getCategoryLabel = (category?: string): string => {
    switch (category) {
      case "argot": return "ARGOT";
      case "verlan": return "VERLAN";
      case "reference": return "REF";
      case "anglicisme": return "ANGL.";
      case "expression": return "EXPR.";
      default: return "TERME";
    }
  };

  // Font size — same for lyrics and explanations
  const FONT_SIZE = 28;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ===== HOOK SCREEN ===== */}
      {hook && (
        <Sequence from={0} durationInFrames={hookDurationFrames}>
          <HookScreen hook={hook} style={style} />
        </Sequence>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <Sequence from={hookDurationFrames}>
        <AbsoluteFill>
          {/* Background gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${gradientAngle}deg,
                ${bgColor1} 0%, ${bgColor2} 50%, ${bgColor1} 100%)`,
            }}
          />

          {/* Optional background image from public/ */}
          {style.backgroundImage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.15,
                filter: "blur(8px) brightness(0.6)",
                overflow: "hidden",
              }}
            >
              <Img
                src={staticFile(style.backgroundImage)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* ===== HEADER ===== */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 180,
              display: "flex",
              alignItems: "center",
              padding: "50px 36px 16px",
              gap: 20,
              zIndex: 10,
            }}
          >
            {/* Cover art thumbnail */}
            {track.coverImage && (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
                  border: `1px solid rgba(255,255,255,0.1)`,
                }}
              >
                <Img
                  src={staticFile(track.coverImage)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Track info */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#ffffff",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}
              >
                {track.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                {track.artist}
              </div>
            </div>

            {/* Term counter */}
            <div
              style={{
                background: `${highlight}20`,
                border: `1px solid ${highlight}40`,
                borderRadius: 16,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: highlight,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {decodedTerms}/{totalTerms}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                décodés
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              position: "absolute",
              top: 175,
              left: 36,
              right: 36,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            }}
          />

          {/* ===== SIDE-BY-SIDE LAYOUT ===== */}
          <div
            style={{
              position: "absolute",
              top: 195,
              left: 0,
              right: 0,
              bottom: 100,
              display: "flex",
              flexDirection: "row",
            }}
          >
            {/* ===== LEFT: LYRICS ===== */}
            <div
              style={{
                flex: 1,
                padding: "20px 16px 20px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Fade top */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: 60,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
                  zIndex: 5, pointerEvents: "none",
                }}
              />

              {/* Lyrics lines */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transform: `translateY(${
                    activeLineIndex > 0 ? -(activeLineIndex * 80 - 60) : 0
                  }px)`,
                  transition: "transform 0.5s ease-out",
                }}
              >
                {lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPast = currentTime >= line.endTime;

                  let opacity = 0.2;
                  if (isActive) opacity = 1;
                  else if (isPast) opacity = 0.3;

                  // Highlight terms in text
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
                            color: highlight,
                            fontWeight: 800,
                            textShadow: `0 0 15px ${highlight}50`,
                            textDecoration: "underline",
                            textDecorationColor: `${highlight}60`,
                            textUnderlineOffset: 4,
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
                        transition: "opacity 0.3s ease",
                        padding: "6px 0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: FONT_SIZE,
                          fontWeight: isActive ? 700 : 400,
                          color: isPast ? "rgba(255,255,255,0.3)" : "#ffffff",
                          fontFamily: "'Inter', sans-serif",
                          lineHeight: 1.5,
                        }}
                      >
                        {renderText()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fade bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0, height: 60,
                  background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)",
                  zIndex: 5, pointerEvents: "none",
                }}
              />
            </div>

            {/* ===== VERTICAL DIVIDER ===== */}
            <div
              style={{
                width: 1,
                background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)",
                marginTop: 20,
                marginBottom: 20,
              }}
            />

            {/* ===== RIGHT: EXPLANATIONS ===== */}
            <div
              style={{
                flex: 1,
                padding: "20px 36px 20px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 16,
                overflow: "hidden",
              }}
            >
              {currentTerms.length > 0 ? (
                currentTerms.map((term, i) => {
                  const termFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                  const termSpring = spring({
                    frame: Math.max(0, termFrame - i * 6 - 8),
                    fps,
                    config: { damping: 12, stiffness: 150, mass: 0.7 },
                  });

                  return (
                    <div
                      key={`expl-${term.term}-${i}`}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(16px)",
                        borderRadius: 16,
                        padding: "18px 20px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        transform: `translateX(${(1 - termSpring) * 40}px)`,
                        opacity: termSpring,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Category badge + term */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        {term.category && (
                          <div
                            style={{
                              background: getCategoryColor(term.category),
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 5,
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: 1,
                            }}
                          >
                            {getCategoryLabel(term.category)}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: FONT_SIZE,
                            fontWeight: 800,
                            color: highlight,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {term.term}
                        </div>
                      </div>

                      {/* Definition — same font size as lyrics */}
                      <div
                        style={{
                          fontSize: FONT_SIZE - 4,
                          color: "rgba(255,255,255,0.75)",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          lineHeight: 1.5,
                        }}
                      >
                        {term.definition}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty state: subtle waiting indicator */
                <div
                  style={{
                    textAlign: "center",
                    opacity: 0.2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontFamily: "'Inter', sans-serif",
                      color: highlight,
                    }}
                  >
                    ?
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginTop: 8,
                    }}
                  >
                    Décryptage...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== BOTTOM BAR ===== */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 90,
              padding: "0 36px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 3,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${videoProgress * 100}%`,
                  height: "100%",
                  background: highlight,
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${highlight}60`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Lyrics Decoded
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                @toncompte
              </div>
            </div>
          </div>

          {/* ===== AUDIO ===== */}
          {track.audioFile && <Audio src={staticFile(track.audioFile)} />}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
