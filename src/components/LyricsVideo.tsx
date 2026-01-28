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

  // Adjust frame for content after hook
  const contentFrame = frame - hookDurationFrames;
  const currentTime = contentFrame / fps;
  const isHookPhase = frame < hookDurationFrames;

  // Find active line
  const activeLine = useMemo(() => {
    if (isHookPhase) return null;
    return lyrics.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
  }, [lyrics, currentTime, isHookPhase]);

  // Find active line index
  const activeLineIndex = useMemo(() => {
    if (!activeLine) return -1;
    return lyrics.indexOf(activeLine);
  }, [activeLine, lyrics]);

  // Line progress
  const getLineProgress = (line: LyricLineType): number => {
    if (currentTime < line.startTime) return 0;
    if (currentTime >= line.endTime) return 1;
    return (currentTime - line.startTime) / (line.endTime - line.startTime);
  };

  // Count total terms and decoded so far
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
        if (progress > 0.5) {
          count += Math.min(
            line.terms.length,
            Math.ceil(progress * line.terms.length)
          );
        }
      }
    }
    return Math.min(count, totalTerms);
  }, [lyrics, currentTime, totalTerms, isHookPhase]);

  // Current terms to show in explanation panel
  const currentTerms = useMemo(() => {
    if (!activeLine || !activeLine.showExplanation) return [];
    const progress = getLineProgress(activeLine);
    if (progress < 0.3) return [];
    const numTerms = Math.min(
      activeLine.terms.length,
      Math.ceil(((progress - 0.3) / 0.7) * activeLine.terms.length)
    );
    return activeLine.terms.slice(0, numTerms);
  }, [activeLine, currentTime]);

  // Background gradient animation
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 315]);
  const bgPulse = Math.sin(frame * 0.02) * 0.15 + 0.85;

  // Overall video progress for progress bar
  const videoProgress = frame / durationInFrames;

  // Category colors
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
          {/* Animated dark gradient background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${gradientAngle}deg,
                #08080e 0%,
                #12082a 30%,
                #0a1628 60%,
                #08080e 100%)`,
              opacity: bgPulse,
            }}
          />

          {/* Blurred cover art background */}
          {track.coverImage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.08,
                filter: "blur(60px) saturate(1.5)",
                overflow: "hidden",
              }}
            >
              <Img
                src={track.coverImage}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Subtle grain/noise overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.03,
              backgroundImage:
                "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==)",
            }}
          />

          {/* ===== HEADER ===== */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              display: "flex",
              alignItems: "center",
              padding: "50px 40px 20px",
              gap: 24,
              zIndex: 10,
            }}
          >
            {/* Cover art thumbnail */}
            {track.coverImage && (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 14,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 30px ${style.highlightColor}20`,
                  border: `1px solid rgba(255,255,255,0.1)`,
                }}
              >
                <Img
                  src={track.coverImage}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Track info */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 28,
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
                  fontSize: 20,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                {track.artist}
              </div>
            </div>

            {/* Term counter badge */}
            <div
              style={{
                background: `linear-gradient(135deg, ${style.highlightColor}30, ${style.highlightColor}10)`,
                border: `1px solid ${style.highlightColor}40`,
                borderRadius: 20,
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: style.highlightColor,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {decodedTerms}/{totalTerms}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                decoded
              </div>
            </div>
          </div>

          {/* Divider line under header */}
          <div
            style={{
              position: "absolute",
              top: 195,
              left: 40,
              right: 40,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            }}
          />

          {/* ===== MAIN SPLIT LAYOUT ===== */}
          <div
            style={{
              position: "absolute",
              top: 210,
              left: 0,
              right: 0,
              bottom: 120,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* LEFT SIDE - LYRICS (Spotify-style scroll) */}
            <div
              style={{
                flex: 1,
                padding: "30px 50px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Fade gradient top */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background:
                    "linear-gradient(180deg, rgba(8,8,14,1) 0%, transparent 100%)",
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              />

              {/* Lyrics scroll container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  transform: `translateY(${
                    activeLineIndex > 0
                      ? -(activeLineIndex * 100 - 80)
                      : 0
                  }px)`,
                  transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPast = currentTime >= line.endTime;
                  const isFuture = currentTime < line.startTime;
                  const progress = isActive ? getLineProgress(line) : 0;

                  // Opacity based on distance from active
                  let opacity = 0.2;
                  if (isActive) opacity = 1;
                  else if (isPast && index >= activeLineIndex - 2) opacity = 0.35;
                  else if (isFuture && index <= activeLineIndex + 3) opacity = 0.2;
                  else if (isPast) opacity = 0.15;

                  // Scale for active line
                  const scale = isActive ? 1 : 0.92;

                  // Highlight terms in text
                  const renderText = () => {
                    if (line.terms.length === 0 || !isActive) {
                      return line.text;
                    }

                    const elements: React.ReactNode[] = [];
                    let lastIdx = 0;

                    const termPositions = line.terms
                      .map((t) => ({
                        term: t,
                        index: line.text
                          .toLowerCase()
                          .indexOf(t.term.toLowerCase()),
                      }))
                      .filter((t) => t.index !== -1)
                      .sort((a, b) => a.index - b.index);

                    termPositions.forEach(({ term, index: tIdx }, i) => {
                      if (tIdx > lastIdx) {
                        elements.push(
                          <span key={`t-${i}-pre`}>
                            {line.text.slice(lastIdx, tIdx)}
                          </span>
                        );
                      }
                      elements.push(
                        <span
                          key={`term-${i}`}
                          style={{
                            color: style.highlightColor,
                            fontWeight: 800,
                            textShadow: `0 0 20px ${style.highlightColor}60`,
                            borderBottom: `2px solid ${style.highlightColor}60`,
                            paddingBottom: 2,
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

                  // Karaoke progress bar for active line
                  const karaokeWidth = isActive ? `${progress * 100}%` : "0%";

                  return (
                    <div
                      key={line.id}
                      style={{
                        opacity,
                        transform: `scale(${scale})`,
                        transformOrigin: "left center",
                        transition:
                          "opacity 0.4s ease, transform 0.4s ease",
                        position: "relative",
                        padding: "8px 0",
                      }}
                    >
                      {/* Karaoke progress indicator */}
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            left: -20,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            borderRadius: 2,
                            background: `rgba(255,255,255,0.1)`,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: karaokeWidth,
                              background: style.highlightColor,
                              borderRadius: 2,
                              boxShadow: `0 0 8px ${style.highlightColor}`,
                            }}
                          />
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: isActive ? 36 : 30,
                          fontWeight: isActive ? 700 : 500,
                          color: isPast
                            ? "rgba(255,255,255,0.35)"
                            : isActive
                            ? "#ffffff"
                            : "rgba(255,255,255,0.25)",
                          fontFamily: "'Inter', sans-serif",
                          lineHeight: 1.5,
                          letterSpacing: -0.3,
                        }}
                      >
                        {renderText()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fade gradient bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background:
                    "linear-gradient(0deg, rgba(8,8,14,1) 0%, transparent 100%)",
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* ===== RIGHT SIDE - EXPLANATIONS ===== */}
            {currentTerms.length > 0 && (
              <div
                style={{
                  padding: "10px 40px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {currentTerms.map((term, i) => {
                  const termFrame = contentFrame - (activeLine ? activeLine.startTime * fps : 0);
                  const termSpring = spring({
                    frame: Math.max(0, termFrame - i * 8 - 15),
                    fps,
                    config: { damping: 12, stiffness: 150, mass: 0.7 },
                  });

                  return (
                    <div
                      key={`expl-${term.term}-${i}`}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(20px)",
                        borderRadius: 18,
                        padding: "20px 24px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        transform: `translateY(${(1 - termSpring) * 30}px) scale(${0.9 + termSpring * 0.1})`,
                        opacity: termSpring,
                        boxShadow: `0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      }}
                    >
                      {/* Category + Term row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 10,
                        }}
                      >
                        {/* Category badge */}
                        {term.category && (
                          <div
                            style={{
                              background: getCategoryColor(term.category),
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: 6,
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: 1,
                            }}
                          >
                            {getCategoryLabel(term.category)}
                          </div>
                        )}

                        {/* Term */}
                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 800,
                            color: style.highlightColor,
                            fontFamily: "'Inter', sans-serif",
                            textShadow: `0 0 15px ${style.highlightColor}40`,
                          }}
                        >
                          {term.term}
                        </div>
                      </div>

                      {/* Definition */}
                      <div
                        style={{
                          fontSize: 20,
                          color: "rgba(255,255,255,0.75)",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          lineHeight: 1.5,
                          paddingLeft: term.category ? 0 : 0,
                        }}
                      >
                        = {term.definition}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== BOTTOM BAR ===== */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 110,
              padding: "0 40px 50px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${videoProgress * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${style.highlightColor}, ${style.highlightColor}cc)`,
                  borderRadius: 2,
                  boxShadow: `0 0 10px ${style.highlightColor}60`,
                }}
              />
            </div>

            {/* Bottom text */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.3)",
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
                  fontSize: 14,
                  color: "rgba(255,255,255,0.3)",
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
