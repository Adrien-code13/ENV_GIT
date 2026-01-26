import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  staticFile,
} from "remotion";
import type { RapLyricsVideo, LyricLine as LyricLineType } from "../types";
import { LyricLine } from "./LyricLine";
import { TermExplanationPopup } from "./TermExplanation";

interface LyricsVideoProps {
  data: RapLyricsVideo;
}

export const LyricsVideo: React.FC<LyricsVideoProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const currentTime = frame / fps;
  const { track, lyrics, style, config } = data;

  // Find the current active line based on time
  const activeLine = useMemo(() => {
    return lyrics.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
  }, [lyrics, currentTime]);

  // Calculate progress within the current line
  const getLineProgress = (line: LyricLineType): number => {
    if (currentTime < line.startTime) return 0;
    if (currentTime >= line.endTime) return 1;
    return (currentTime - line.startTime) / (line.endTime - line.startTime);
  };

  // Check if we should show explanation for current line
  const shouldShowExplanation = useMemo(() => {
    if (!activeLine?.showExplanation || activeLine.terms.length === 0) {
      return false;
    }
    const progress = getLineProgress(activeLine);
    // Show explanation after 40% of the line duration
    return progress > 0.4;
  }, [activeLine, currentTime]);

  // Get current term to explain
  const currentTerm = useMemo(() => {
    if (!shouldShowExplanation || !activeLine) return null;
    const progress = getLineProgress(activeLine);
    const termIndex = Math.floor((progress - 0.4) / 0.3 * activeLine.terms.length);
    return activeLine.terms[Math.min(termIndex, activeLine.terms.length - 1)];
  }, [shouldShowExplanation, activeLine, currentTime]);

  // Get explanation progress
  const getExplanationProgress = (): number => {
    if (!activeLine) return 0;
    const lineProgress = getLineProgress(activeLine);
    // Explanation shows from 40% to 100% of line duration
    return Math.max(0, Math.min(1, (lineProgress - 0.4) / 0.6));
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(180deg,
            rgba(0,0,0,0.3) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0,0,0,0.5) 100%)`,
        }}
      />

      {/* Cover image (if provided) */}
      {track.coverImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
            filter: "blur(30px)",
            overflow: "hidden",
          }}
        >
          <Img
            src={staticFile(track.coverImage)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Track info header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            fontSize: style.fontSize * 0.5,
            color: style.highlightColor,
            fontFamily: style.fontFamily,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          {track.artist}
        </div>
        <div
          style={{
            fontSize: style.fontSize * 0.4,
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: style.fontFamily,
          }}
        >
          {track.title}
        </div>
      </div>

      {/* Lyrics display area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          padding: "0 20px",
          marginTop: -100,
        }}
      >
        {/* Previous line (faded) */}
        {lyrics
          .filter((line) => line.endTime <= currentTime && line.endTime > currentTime - 2)
          .slice(-1)
          .map((line) => (
            <div
              key={`prev-${line.id}`}
              style={{
                opacity: 0.3,
                fontSize: style.fontSize * 0.7,
                color: style.textColor,
                fontFamily: style.fontFamily,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {line.text}
            </div>
          ))}

        {/* Current line */}
        {activeLine && (
          <LyricLine
            line={activeLine}
            style={style}
            isActive={true}
            progress={getLineProgress(activeLine)}
          />
        )}

        {/* Next line preview (faded) */}
        {lyrics
          .filter((line) => line.startTime > currentTime && line.startTime < currentTime + 3)
          .slice(0, 1)
          .map((line) => (
            <div
              key={`next-${line.id}`}
              style={{
                opacity: 0.2,
                fontSize: style.fontSize * 0.6,
                color: style.textColor,
                fontFamily: style.fontFamily,
                textAlign: "center",
                marginTop: 30,
              }}
            >
              {line.text}
            </div>
          ))}
      </div>

      {/* Term explanation popup */}
      {shouldShowExplanation && currentTerm && (
        <TermExplanationPopup
          term={currentTerm}
          style={style}
          progress={getExplanationProgress()}
        />
      )}

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          right: 40,
          height: 4,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            width: `${(frame / durationInFrames) * 100}%`,
            height: "100%",
            backgroundColor: style.highlightColor,
            borderRadius: 2,
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Audio track (if provided) */}
      {track.audioFile && (
        <Audio src={staticFile(track.audioFile)} />
      )}
    </AbsoluteFill>
  );
};
