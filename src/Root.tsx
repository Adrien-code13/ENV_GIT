import React from "react";
import { Composition } from "remotion";
import { LyricsVideo } from "./components";
import type { RapLyricsVideo } from "./types";

// Import your data file
import exampleData from "./data/bande-organisee.json";

// Calculate total duration from lyrics
const calculateDuration = (data: RapLyricsVideo, fps: number): number => {
  if (data.lyrics.length === 0) return fps * 10; // Default 10 seconds
  const lastLine = data.lyrics[data.lyrics.length - 1];
  // Add 2 seconds buffer at the end
  return Math.ceil((lastLine.endTime + 2) * fps);
};

export const RemotionRoot: React.FC = () => {
  const data = exampleData as RapLyricsVideo;
  const fps = data.config?.fps ?? 30;
  const durationInFrames = calculateDuration(data, fps);

  return (
    <>
      <Composition
        id="LyricsVideo"
        component={LyricsVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={data.config?.width ?? 1080}
        height={data.config?.height ?? 1920}
        defaultProps={{
          data,
        }}
      />

      {/* TikTok format (9:16) */}
      <Composition
        id="LyricsVideo-TikTok"
        component={LyricsVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          data,
        }}
      />

      {/* YouTube Shorts format (9:16) */}
      <Composition
        id="LyricsVideo-Shorts"
        component={LyricsVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          data,
        }}
      />

      {/* YouTube standard format (16:9) */}
      <Composition
        id="LyricsVideo-YouTube"
        component={LyricsVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          data: {
            ...data,
            style: {
              ...data.style,
              fontSize: 36, // Smaller font for landscape
            },
          },
        }}
      />
    </>
  );
};
