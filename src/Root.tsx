import React from "react";
import { Composition } from "remotion";
import { LyricsVideo } from "./components";
import type { RapLyricsVideo } from "./types";

// Import your data file
import exampleData from "./data/autobahn.json";

// Calculate total duration from lyrics + hook
const calculateDuration = (data: RapLyricsVideo, fps: number): number => {
  const hookDuration = data.hook?.duration ?? 0;
  if (data.lyrics.length === 0) return Math.ceil((hookDuration + 10) * fps);
  const lastLine = data.lyrics[data.lyrics.length - 1];
  // Hook duration + lyrics duration + 2s buffer
  return Math.ceil((hookDuration + lastLine.endTime + 2) * fps);
};

export const RemotionRoot: React.FC = () => {
  const data = exampleData as RapLyricsVideo;
  const fps = data.config?.fps ?? 30;
  const durationInFrames = calculateDuration(data, fps);

  return (
    <>
      {/* TikTok / Shorts format (9:16) */}
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
    </>
  );
};
