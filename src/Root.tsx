import React from "react";
import { Composition } from "remotion";
import { LyricsVideo, QuizVideo } from "./components";
import type { RapLyricsVideo, RapQuizVideo } from "./types";

// Import your data file
import exampleData from "./data/autobahn.json";

// Type guard to check if data is a quiz
const isQuizVideo = (data: unknown): data is RapQuizVideo => {
  return typeof data === 'object' && data !== null && 'type' in data && (data as RapQuizVideo).type === 'quiz';
};

// Calculate total duration for lyrics video
const calculateLyricsDuration = (data: RapLyricsVideo, fps: number): number => {
  const hookDuration = data.hook?.duration ?? 0;
  if (data.lyrics.length === 0) return Math.ceil((hookDuration + 10) * fps);
  const lastLine = data.lyrics[data.lyrics.length - 1];
  // Hook duration + lyrics duration + 2.8s buffer for end screen
  return Math.ceil((hookDuration + lastLine.endTime + 2.8) * fps);
};

// Calculate total duration for quiz video
const calculateQuizDuration = (data: RapQuizVideo, fps: number): number => {
  const introDuration = data.introDuration ?? 2;
  const outroDuration = data.outroDuration ?? 3;
  // Each question: 0.5 + 0.3 + 3 + 1 + 0.2 = 5s (faster pacing)
  const questionDuration = 5;
  const totalQuestionTime = data.questions.length * questionDuration;
  return Math.ceil((introDuration + totalQuestionTime + outroDuration) * fps);
};

export const RemotionRoot: React.FC = () => {
  const data = exampleData as RapLyricsVideo | RapQuizVideo;
  const isQuiz = isQuizVideo(data);

  const fps = (data as RapLyricsVideo).config?.fps ?? 30;
  const width = (data as RapLyricsVideo).config?.width ?? 1080;
  const height = (data as RapLyricsVideo).config?.height ?? 1920;

  if (isQuiz) {
    const quizData = data as RapQuizVideo;
    const durationInFrames = calculateQuizDuration(quizData, fps);

    return (
      <>
        <Composition
          id="QuizVideo"
          component={QuizVideo}
          durationInFrames={durationInFrames}
          fps={fps}
          width={width}
          height={height}
          defaultProps={{
            data: quizData,
          }}
        />
      </>
    );
  }

  // Default: Lyrics video (decodage format)
  const lyricsData = data as RapLyricsVideo;
  const durationInFrames = calculateLyricsDuration(lyricsData, fps);

  return (
    <>
      {/* TikTok / Shorts format (9:16) */}
      <Composition
        id="LyricsVideo"
        component={LyricsVideo}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
        defaultProps={{
          data: lyricsData,
        }}
      />
    </>
  );
};
