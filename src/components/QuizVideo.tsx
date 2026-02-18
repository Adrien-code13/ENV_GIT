import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  spring,
  staticFile,
  interpolate,
} from "remotion";
import type { RapQuizVideo, QuizQuestion } from "../types";

interface QuizVideoProps {
  data: RapQuizVideo;
}

// Safe zones for TikTok / YouTube Shorts
const SAFE = { top: 120, bottom: 280, left: 60, right: 60 };

export const QuizVideo: React.FC<QuizVideoProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { questions, style, introDuration, outroDuration } = data;
  const HL = style.primaryColor ?? "#00e676";
  const CORRECT = style.correctColor ?? "#00e676";
  const WRONG = style.wrongColor ?? "#ff4757";
  const COUNTDOWN_COLOR = style.countdownColor ?? "#ffd93d";
  const BG1 = style.backgroundColor ?? "#0b1120";
  const BG2 = style.secondaryColor ?? "#101d35";
  const ACCENT = "#38bdf8";
  const FONT = "'Impact', 'Arial Black', sans-serif";

  // Calculate phase timings
  const introFrames = Math.ceil(introDuration * fps);
  const outroFrames = Math.ceil(outroDuration * fps);

  // Each question:
  // - 0.8s lyric appear
  // - 0.5s question appear
  // - 3.5s countdown + answers
  // - 1.5s reveal
  // - 0.7s explanation
  // Total: ~7s per question
  const LYRIC_PHASE = 0.8;
  const QUESTION_PHASE = 0.5;
  const COUNTDOWN_PHASE = 3.5;
  const REVEAL_PHASE = 1.5;
  const EXPLAIN_PHASE = 0.7;
  const QUESTION_DURATION = LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE + REVEAL_PHASE + EXPLAIN_PHASE;

  // Determine current phase
  const currentTime = frame / fps;
  const isIntro = currentTime < introDuration;

  const questionsStartTime = introDuration;
  const totalQuestionsDuration = questions.length * QUESTION_DURATION;
  const outroStartTime = questionsStartTime + totalQuestionsDuration;

  const isOutro = currentTime >= outroStartTime;
  const isQuestionPhase = !isIntro && !isOutro;

  // Current question index and phase within question
  const questionTimeElapsed = currentTime - questionsStartTime;
  const currentQuestionIndex = Math.floor(questionTimeElapsed / QUESTION_DURATION);
  const timeInCurrentQuestion = questionTimeElapsed - (currentQuestionIndex * QUESTION_DURATION);

  const currentQuestion = questions[Math.min(currentQuestionIndex, questions.length - 1)];

  // Sub-phases within a question
  const isLyricPhase = timeInCurrentQuestion < LYRIC_PHASE;
  const isQuestionTextPhase = timeInCurrentQuestion >= LYRIC_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE;
  const isCountdownPhase = timeInCurrentQuestion >= LYRIC_PHASE + QUESTION_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE;
  const isRevealPhase = timeInCurrentQuestion >= LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE + REVEAL_PHASE;
  const isExplainPhase = timeInCurrentQuestion >= LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE + REVEAL_PHASE;

  // Countdown timer (3, 2, 1)
  const countdownTimeLeft = LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE - timeInCurrentQuestion;
  const countdownNumber = Math.ceil(countdownTimeLeft);

  // Animations
  const pulse = Math.sin(frame * 0.12) * 0.3 + 0.7;
  const fastPulse = Math.sin(frame * 0.25) * 0.5 + 0.5;

  // Intro animation
  const introScale = spring({
    frame: frame,
    fps,
    config: { damping: 8, stiffness: 100, mass: 0.8 },
  });

  // Question entrance
  const questionEntrance = spring({
    frame: Math.max(0, frame - (questionsStartTime + currentQuestionIndex * QUESTION_DURATION) * fps),
    fps,
    config: { damping: 8, stiffness: 180, mass: 0.5 },
  });

  // Reveal flash
  const revealProgress = isRevealPhase ? (timeInCurrentQuestion - (LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE)) / REVEAL_PHASE : 0;

  // Outro animation
  const outroFrame = Math.max(0, (currentTime - outroStartTime) * fps);
  const outroScale = spring({
    frame: outroFrame,
    fps,
    config: { damping: 6, stiffness: 150, mass: 0.5 },
  });

  // Score calculation (for outro) - all correct for demo
  const totalQuestions = questions.length;

  // Get correct answer index
  const correctAnswerIndex = currentQuestion?.answers.findIndex(a => a.isCorrect) ?? 0;

  // Adaptive font size for lyric line
  const getLyricFontSize = (text: string) => {
    if (text.length > 80) return 36;
    if (text.length > 60) return 42;
    if (text.length > 40) return 48;
    return 54;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG1 }}>
      {/* === ANIMATED BACKGROUND === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${interpolate(frame, [0, 300], [160, 200])}deg,
            ${BG1} 0%, #0f1a30 25%, ${BG2} 50%, #0d1528 75%, ${BG1} 100%)`,
        }}
      />

      {/* Floating orbs */}
      {[
        { x: 20, y: 15, size: 400, speed: 0.01, color: HL },
        { x: 80, y: 75, size: 350, speed: 0.015, color: ACCENT },
        { x: 50, y: 50, size: 300, speed: 0.012, color: HL },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${orb.x + Math.sin(frame * orb.speed + i * 2) * 10}%`,
            top: `${orb.y + Math.cos(frame * orb.speed * 0.8 + i) * 8}%`,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}20 0%, transparent 70%)`,
            filter: "blur(80px)",
            opacity: 0.6 + Math.sin(frame * 0.04 + i) * 0.3,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Particles */}
      {Array.from({ length: 15 }).map((_, i) => {
        const seed = i * 137.5;
        const px = (seed * 7.3) % 100;
        const py = ((seed * 3.7) % 100) + Math.sin(frame * 0.025 + i) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: "50%",
              background: i % 2 === 0 ? HL : ACCENT,
              opacity: 0.15 + Math.sin(frame * 0.06 + i * 0.9) * 0.15,
              boxShadow: `0 0 10px ${i % 2 === 0 ? HL : ACCENT}50`,
            }}
          />
        );
      })}

      {/* === INTRO SCREEN === */}
      {isIntro && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
          }}
        >
          {/* Big glow */}
          <div
            style={{
              position: "absolute",
              width: 700,
              height: 700,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${HL}50 0%, ${ACCENT}30 40%, transparent 70%)`,
              opacity: pulse,
              filter: "blur(60px)",
            }}
          />

          <div
            style={{
              transform: `scale(${introScale})`,
              textAlign: "center",
            }}
          >
            {/* Main hook text */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#fff",
                fontFamily: FONT,
                textTransform: "uppercase",
                letterSpacing: 4,
                textShadow: `0 4px 40px rgba(0,0,0,0.6), 0 0 60px ${HL}40`,
                lineHeight: 1.15,
                marginBottom: 30,
              }}
            >
              TU CONNAIS
              <br />
              <span style={{ color: HL }}>VRAIMENT</span>
              <br />
              LE RAP FR ?
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                fontFamily: FONT,
                letterSpacing: 6,
                textTransform: "uppercase",
              }}
            >
              {totalQuestions} QUESTIONS
            </div>

            {/* Pulsing arrow */}
            <div
              style={{
                marginTop: 40,
                fontSize: 60,
                opacity: fastPulse,
                transform: `translateY(${Math.sin(frame * 0.15) * 8}px)`,
              }}
            >
              👇
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* === QUESTION PHASE === */}
      {isQuestionPhase && currentQuestion && (
        <AbsoluteFill
          style={{
            padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
          }}
        >
          {/* Question number badge */}
          <div
            style={{
              position: "absolute",
              top: SAFE.top,
              left: SAFE.left,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                background: HL,
                color: "#000",
                fontSize: 32,
                fontWeight: 900,
                fontFamily: FONT,
                padding: "8px 20px",
                borderRadius: 12,
                boxShadow: `0 0 30px ${HL}50`,
              }}
            >
              {currentQuestionIndex + 1}/{totalQuestions}
            </div>
            {currentQuestion.artist && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {currentQuestion.artist}
              </div>
            )}
          </div>

          {/* Main content area */}
          <div
            style={{
              position: "absolute",
              top: SAFE.top + 80,
              left: SAFE.left,
              right: SAFE.right,
              bottom: SAFE.bottom,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              gap: 24,
            }}
          >
            {/* Lyric line - always visible after lyric phase */}
            {!isLyricPhase || timeInCurrentQuestion > 0.2 ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "24px 28px",
                  borderLeft: `5px solid ${HL}`,
                  boxShadow: `0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  backdropFilter: "blur(10px)",
                  transform: `translateY(${(1 - questionEntrance) * 30}px)`,
                  opacity: questionEntrance,
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: HL,
                    fontFamily: FONT,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  🎵 PAROLES
                </div>
                <div
                  style={{
                    fontSize: getLyricFontSize(currentQuestion.lyricLine),
                    fontWeight: 900,
                    color: "#fff",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    lineHeight: 1.25,
                  }}
                >
                  {(() => {
                    const termIndex = currentQuestion.lyricLine.toLowerCase().indexOf(currentQuestion.term.toLowerCase());
                    if (termIndex === -1) return currentQuestion.lyricLine;
                    const before = currentQuestion.lyricLine.slice(0, termIndex);
                    const term = currentQuestion.lyricLine.slice(termIndex, termIndex + currentQuestion.term.length);
                    const after = currentQuestion.lyricLine.slice(termIndex + currentQuestion.term.length);
                    return (
                      <>
                        {before}
                        <span
                          style={{
                            background: HL,
                            color: "#000",
                            padding: "2px 8px",
                            borderRadius: 6,
                            boxShadow: `0 0 20px ${HL}60`,
                          }}
                        >
                          {term}
                        </span>
                        {after}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : null}

            {/* Question text */}
            {(isQuestionTextPhase || isCountdownPhase || isRevealPhase || isExplainPhase) && (
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: FONT,
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  marginTop: 10,
                  transform: `scale(${spring({
                    frame: Math.max(0, (timeInCurrentQuestion - LYRIC_PHASE) * fps),
                    fps,
                    config: { damping: 6, stiffness: 200, mass: 0.4 },
                  })})`,
                }}
              >
                {currentQuestion.question}
              </div>
            )}

            {/* Answer choices */}
            {(isCountdownPhase || isRevealPhase || isExplainPhase) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {currentQuestion.answers.map((answer, i) => {
                  const isCorrect = answer.isCorrect;
                  const showResult = isRevealPhase || isExplainPhase;
                  const answerEntrance = spring({
                    frame: Math.max(0, (timeInCurrentQuestion - LYRIC_PHASE - QUESTION_PHASE - i * 0.1) * fps),
                    fps,
                    config: { damping: 8, stiffness: 180, mass: 0.4 },
                  });

                  let bgColor = "rgba(255,255,255,0.1)";
                  let borderColor = "rgba(255,255,255,0.2)";
                  let textColor = "#fff";

                  if (showResult) {
                    if (isCorrect) {
                      bgColor = `${CORRECT}30`;
                      borderColor = CORRECT;
                      textColor = CORRECT;
                    } else {
                      bgColor = `${WRONG}20`;
                      borderColor = `${WRONG}60`;
                      textColor = `${WRONG}aa`;
                    }
                  }

                  const letters = ["A", "B", "C", "D"];

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        background: bgColor,
                        border: `3px solid ${borderColor}`,
                        borderRadius: 16,
                        padding: "18px 24px",
                        transform: `translateX(${(1 - answerEntrance) * 100}px) scale(${showResult && isCorrect ? 1 + Math.sin(frame * 0.2) * 0.03 : 1})`,
                        opacity: answerEntrance,
                        boxShadow: showResult && isCorrect ? `0 0 30px ${CORRECT}40` : "none",
                        transition: "background 0.3s, border-color 0.3s",
                      }}
                    >
                      {/* Letter badge */}
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 12,
                          background: showResult && isCorrect ? CORRECT : showResult ? `${WRONG}60` : HL,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 28,
                          fontWeight: 900,
                          color: showResult && !isCorrect ? "#fff" : "#000",
                          fontFamily: FONT,
                          flexShrink: 0,
                        }}
                      >
                        {letters[i]}
                      </div>

                      {/* Answer text */}
                      <div
                        style={{
                          fontSize: 34,
                          fontWeight: 800,
                          color: textColor,
                          fontFamily: FONT,
                          textTransform: "uppercase",
                          flex: 1,
                        }}
                      >
                        {answer.text}
                      </div>

                      {/* Check/X icon on reveal */}
                      {showResult && (
                        <div style={{ fontSize: 36 }}>
                          {isCorrect ? "✅" : "❌"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Countdown timer */}
            {isCountdownPhase && (
              <div
                style={{
                  position: "absolute",
                  bottom: 80,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Circular timer */}
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `conic-gradient(${COUNTDOWN_COLOR} ${(countdownTimeLeft / COUNTDOWN_PHASE) * 100}%, rgba(255,255,255,0.1) 0%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 40px ${COUNTDOWN_COLOR}50`,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: BG1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      fontWeight: 900,
                      color: COUNTDOWN_COLOR,
                      fontFamily: FONT,
                      transform: `scale(${1 + Math.sin(frame * 0.3) * 0.1})`,
                    }}
                  >
                    {Math.max(1, countdownNumber)}
                  </div>
                </div>
              </div>
            )}

            {/* Explanation on reveal */}
            {isExplainPhase && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${CORRECT}20, ${CORRECT}10)`,
                  border: `2px solid ${CORRECT}60`,
                  borderRadius: 16,
                  padding: "20px 28px",
                  marginTop: 10,
                  transform: `scale(${spring({
                    frame: Math.max(0, (timeInCurrentQuestion - LYRIC_PHASE - QUESTION_PHASE - COUNTDOWN_PHASE - REVEAL_PHASE) * fps),
                    fps,
                    config: { damping: 6, stiffness: 180, mass: 0.4 },
                  })})`,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: FONT,
                    lineHeight: 1.3,
                  }}
                >
                  💡 {currentQuestion.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Flash on reveal */}
          {isRevealPhase && revealProgress < 0.3 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${CORRECT}60 0%, transparent 60%)`,
                opacity: interpolate(revealProgress, [0, 0.3], [0.6, 0], { extrapolateRight: "clamp" }),
                pointerEvents: "none",
              }}
            />
          )}
        </AbsoluteFill>
      )}

      {/* === OUTRO / SCORE SCREEN === */}
      {isOutro && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
          }}
        >
          {/* Big glow */}
          <div
            style={{
              position: "absolute",
              width: 800,
              height: 800,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${HL}40 0%, ${ACCENT}20 40%, transparent 60%)`,
              opacity: pulse,
              filter: "blur(70px)",
            }}
          />

          <div
            style={{
              transform: `scale(${outroScale})`,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Question */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "#fff",
                fontFamily: FONT,
                textTransform: "uppercase",
                letterSpacing: 3,
                textShadow: "0 4px 30px rgba(0,0,0,0.6)",
                marginBottom: 20,
              }}
            >
              T'AS EU COMBIEN ?
            </div>

            {/* Score display */}
            <div
              style={{
                fontSize: 140,
                fontWeight: 900,
                color: HL,
                fontFamily: FONT,
                lineHeight: 1,
                textShadow: `0 0 60px ${HL}80, 0 0 120px ${HL}40`,
                marginBottom: 30,
              }}
            >
              ?/{totalQuestions}
            </div>

            {/* CTA: COMMENTE */}
            <div
              style={{
                position: "relative",
                marginBottom: 20,
              }}
            >
              {/* Pulsing ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: 24,
                  border: `4px solid ${HL}`,
                  opacity: 0.3 + Math.sin(frame * 0.15) * 0.3,
                  transform: `scale(${1 + Math.sin(frame * 0.15) * 0.08})`,
                }}
              />
              <div
                style={{
                  background: `linear-gradient(135deg, ${HL}, ${HL}cc)`,
                  borderRadius: 16,
                  padding: "22px 50px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: `0 0 60px ${HL}70, 0 0 100px ${HL}40`,
                  transform: `scale(${1 + Math.sin(frame * 0.12) * 0.06})`,
                  border: "3px solid rgba(255,255,255,0.3)",
                }}
              >
                <span style={{ fontSize: 48, transform: `translateX(${Math.sin(frame * 0.2) * 5}px)` }}>
                  👇
                </span>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: "#000",
                    fontFamily: FONT,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  COMMENTE TON SCORE !
                </div>
                <span style={{ fontSize: 48, transform: `translateX(${-Math.sin(frame * 0.2) * 5}px)` }}>
                  👇
                </span>
              </div>
            </div>

            {/* Subscribe button */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#ff0000",
                borderRadius: 14,
                padding: "16px 44px",
                boxShadow: "0 0 50px rgba(255,0,0,0.55), 0 8px 30px rgba(0,0,0,0.4)",
                transform: `scale(${1 + Math.sin(frame * 0.12) * 0.05})`,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: FONT,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                ABONNE-TOI
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* === AUDIO === */}
      {data.audioFile && <Audio src={staticFile(data.audioFile)} />}
    </AbsoluteFill>
  );
};
