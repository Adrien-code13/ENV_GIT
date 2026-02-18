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
import type { RapQuizVideo } from "../types";

interface QuizVideoProps {
  data: RapQuizVideo;
}

const SAFE = { top: 100, bottom: 250, left: 50, right: 50 };

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

  const introFrames = Math.ceil(introDuration * fps);

  // FASTER PACING: 5s per question
  // 0.5s lyric slam + 0.3s question + 3s countdown + 1s reveal + 0.2s transition
  const LYRIC_PHASE = 0.5;
  const QUESTION_PHASE = 0.3;
  const COUNTDOWN_PHASE = 3;
  const REVEAL_PHASE = 1;
  const TRANSITION_PHASE = 0.2;
  const QUESTION_DURATION = LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE + REVEAL_PHASE + TRANSITION_PHASE;

  const currentTime = frame / fps;
  const isIntro = currentTime < introDuration;

  const questionsStartTime = introDuration;
  const totalQuestionsDuration = questions.length * QUESTION_DURATION;
  const outroStartTime = questionsStartTime + totalQuestionsDuration;

  const isOutro = currentTime >= outroStartTime;
  const isQuestionPhase = !isIntro && !isOutro;

  const questionTimeElapsed = currentTime - questionsStartTime;
  const currentQuestionIndex = Math.floor(questionTimeElapsed / QUESTION_DURATION);
  const timeInCurrentQuestion = questionTimeElapsed - (currentQuestionIndex * QUESTION_DURATION);

  const currentQuestion = questions[Math.min(currentQuestionIndex, questions.length - 1)];
  const totalQuestions = questions.length;

  // Sub-phases
  const isLyricPhase = timeInCurrentQuestion < LYRIC_PHASE;
  const isQuestionTextPhase = timeInCurrentQuestion >= LYRIC_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE;
  const isCountdownPhase = timeInCurrentQuestion >= LYRIC_PHASE + QUESTION_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE;
  const isRevealPhase = timeInCurrentQuestion >= LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE && timeInCurrentQuestion < LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE + REVEAL_PHASE;

  // Countdown progress (1 to 0)
  const countdownProgress = isCountdownPhase
    ? 1 - (timeInCurrentQuestion - LYRIC_PHASE - QUESTION_PHASE) / COUNTDOWN_PHASE
    : 0;

  // Beep effect simulation (visual pulse on each second)
  const countdownSecond = Math.ceil(countdownProgress * 3);
  const isBeepMoment = isCountdownPhase && (countdownProgress * 3) % 1 > 0.9;

  // Animations
  const pulse = Math.sin(frame * 0.12) * 0.3 + 0.7;
  const fastPulse = Math.sin(frame * 0.25) * 0.5 + 0.5;

  // Screen shake on reveal
  const revealProgress = isRevealPhase ? (timeInCurrentQuestion - (LYRIC_PHASE + QUESTION_PHASE + COUNTDOWN_PHASE)) / REVEAL_PHASE : 0;
  const shakeX = isRevealPhase && revealProgress < 0.3 ? Math.sin(frame * 8) * 12 * (1 - revealProgress * 3) : 0;
  const shakeY = isRevealPhase && revealProgress < 0.3 ? Math.cos(frame * 10) * 8 * (1 - revealProgress * 3) : 0;

  // Outro animation
  const outroFrame = Math.max(0, (currentTime - outroStartTime) * fps);
  const outroScale = spring({
    frame: outroFrame,
    fps,
    config: { damping: 6, stiffness: 150, mass: 0.5 },
  });

  const correctAnswerIndex = currentQuestion?.answers.findIndex(a => a.isCorrect) ?? 0;

  // Confetti particles for correct reveal
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      x: Math.random() * 100,
      startY: -10,
      speed: 2 + Math.random() * 3,
      size: 8 + Math.random() * 12,
      color: [HL, ACCENT, "#ffd93d", "#ff6b6b", "#a855f7"][i % 5],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 20,
    }));
  }, [HL, ACCENT]);

  const getLyricFontSize = (text: string) => {
    if (text.length > 70) return 34;
    if (text.length > 50) return 40;
    if (text.length > 35) return 46;
    return 52;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: BG1 }}>
      {/* === ANIMATED BACKGROUND === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${BG2} 0%, ${BG1} 70%)`,
        }}
      />

      {/* Pulsing orbs */}
      {[
        { x: 15, y: 20, size: 350, color: HL },
        { x: 85, y: 70, size: 300, color: ACCENT },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}25 0%, transparent 70%)`,
            filter: "blur(60px)",
            opacity: 0.5 + Math.sin(frame * 0.05 + i) * 0.3,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Main content with shake */}
      <div style={{ transform: `translate(${shakeX}px, ${shakeY}px)`, width: "100%", height: "100%" }}>

        {/* === INTRO - HOOK ADDICTIF === */}
        {isIntro && (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
            }}
          >
            {/* Flash burst on entry */}
            {frame < 8 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle, ${HL}90 0%, transparent 60%)`,
                  opacity: interpolate(frame, [0, 8], [0.8, 0], { extrapolateRight: "clamp" }),
                }}
              />
            )}

            {/* Big glow */}
            <div
              style={{
                position: "absolute",
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${HL}50 0%, transparent 60%)`,
                opacity: pulse,
                filter: "blur(50px)",
              }}
            />

            <div style={{ textAlign: "center", zIndex: 10 }}>
              {/* HOOK PRINCIPAL - Scarcity/Challenge */}
              <div
                style={{
                  fontSize: 90,
                  fontWeight: 900,
                  color: HL,
                  fontFamily: FONT,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  textShadow: `0 0 60px ${HL}80, 0 4px 30px rgba(0,0,0,0.6)`,
                  lineHeight: 1.1,
                  transform: `scale(${spring({
                    frame,
                    fps,
                    config: { damping: 6, stiffness: 120, mass: 0.6 },
                  })})`,
                }}
              >
                SEUL 1%
              </div>
              <div
                style={{
                  fontSize: 70,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: FONT,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  textShadow: "0 4px 30px rgba(0,0,0,0.6)",
                  marginTop: 10,
                  transform: `scale(${spring({
                    frame: Math.max(0, frame - 4),
                    fps,
                    config: { damping: 8, stiffness: 150, mass: 0.5 },
                  })})`,
                }}
              >
                A {totalQuestions}/{totalQuestions}
              </div>

              {/* Subtitle - Artist */}
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                  marginTop: 30,
                  opacity: spring({
                    frame: Math.max(0, frame - 12),
                    fps,
                    config: { damping: 10, stiffness: 100, mass: 0.5 },
                  }),
                }}
              >
                {data.subtitle}
              </div>

              {/* Challenge text */}
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: FONT,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginTop: 40,
                  opacity: spring({
                    frame: Math.max(0, frame - 20),
                    fps,
                    config: { damping: 10, stiffness: 100, mass: 0.5 },
                  }),
                }}
              >
                ET TOI ? 🎯
              </div>

              {/* Animated arrows */}
              <div
                style={{
                  marginTop: 30,
                  fontSize: 50,
                  opacity: fastPulse,
                  transform: `translateY(${Math.sin(frame * 0.18) * 10}px)`,
                }}
              >
                👇👇👇
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
            {/* TOP: Progress bar segmentée */}
            <div
              style={{
                position: "absolute",
                top: SAFE.top,
                left: SAFE.left,
                right: SAFE.right,
                display: "flex",
                gap: 8,
                height: 12,
              }}
            >
              {questions.map((_, i) => {
                const isDone = i < currentQuestionIndex;
                const isCurrent = i === currentQuestionIndex;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: "100%",
                      borderRadius: 6,
                      background: isDone
                        ? `linear-gradient(90deg, ${HL}, ${ACCENT})`
                        : isCurrent
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(255,255,255,0.1)",
                      boxShadow: isDone ? `0 0 15px ${HL}50` : "none",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Progress fill for current question */}
                    {isCurrent && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${(1 - countdownProgress) * 100}%`,
                          background: `linear-gradient(90deg, ${HL}, ${ACCENT})`,
                          boxShadow: `0 0 10px ${HL}60`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Question number */}
            <div
              style={{
                position: "absolute",
                top: SAFE.top + 30,
                left: SAFE.left,
                fontSize: 28,
                fontWeight: 900,
                color: "rgba(255,255,255,0.5)",
                fontFamily: FONT,
                letterSpacing: 3,
              }}
            >
              QUESTION {currentQuestionIndex + 1}/{totalQuestions}
            </div>

            {/* Main content */}
            <div
              style={{
                position: "absolute",
                top: SAFE.top + 70,
                left: SAFE.left,
                right: SAFE.right,
                bottom: SAFE.bottom,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* LYRIC LINE - Slam in */}
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  borderLeft: `5px solid ${HL}`,
                  boxShadow: `0 4px 30px rgba(0,0,0,0.4)`,
                  backdropFilter: "blur(10px)",
                  transform: `scale(${spring({
                    frame: Math.max(0, (timeInCurrentQuestion) * fps),
                    fps,
                    config: { damping: 5, stiffness: 200, mass: 0.4 },
                  })}) translateX(${(1 - spring({
                    frame: Math.max(0, (timeInCurrentQuestion) * fps),
                    fps,
                    config: { damping: 8, stiffness: 150, mass: 0.5 },
                  })) * -50}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: HL,
                    fontFamily: FONT,
                    letterSpacing: 4,
                    marginBottom: 8,
                  }}
                >
                  🎵 {currentQuestion.artist}
                </div>
                <div
                  style={{
                    fontSize: getLyricFontSize(currentQuestion.lyricLine),
                    fontWeight: 900,
                    color: "#fff",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    lineHeight: 1.2,
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
                            padding: "2px 10px",
                            borderRadius: 6,
                            boxShadow: `0 0 25px ${HL}70`,
                            display: "inline-block",
                            transform: isBeepMoment ? "scale(1.1)" : "scale(1)",
                            transition: "transform 0.1s",
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

              {/* QUESTION TEXT */}
              {(isQuestionTextPhase || isCountdownPhase || isRevealPhase) && (
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    color: "#fff",
                    fontFamily: FONT,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    textShadow: "0 2px 15px rgba(0,0,0,0.5)",
                    marginTop: 5,
                    transform: `scale(${spring({
                      frame: Math.max(0, (timeInCurrentQuestion - LYRIC_PHASE) * fps),
                      fps,
                      config: { damping: 6, stiffness: 200, mass: 0.3 },
                    })})`,
                  }}
                >
                  {currentQuestion.question}
                </div>
              )}

              {/* COUNTDOWN BAR - Filling/draining with beep pulse */}
              {isCountdownPhase && (
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.15)",
                    overflow: "hidden",
                    marginTop: 5,
                  }}
                >
                  <div
                    style={{
                      width: `${countdownProgress * 100}%`,
                      height: "100%",
                      background: countdownProgress < 0.3
                        ? WRONG
                        : countdownProgress < 0.6
                          ? COUNTDOWN_COLOR
                          : HL,
                      boxShadow: `0 0 20px ${countdownProgress < 0.3 ? WRONG : COUNTDOWN_COLOR}80`,
                      transition: "background 0.3s",
                    }}
                  />
                </div>
              )}

              {/* COUNTDOWN NUMBER - Big pulsing */}
              {isCountdownPhase && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 30,
                    transform: `translateY(-50%) scale(${isBeepMoment ? 1.3 : 1})`,
                    fontSize: 80,
                    fontWeight: 900,
                    color: countdownProgress < 0.3 ? WRONG : COUNTDOWN_COLOR,
                    fontFamily: FONT,
                    textShadow: `0 0 40px ${countdownProgress < 0.3 ? WRONG : COUNTDOWN_COLOR}80`,
                    opacity: 0.9,
                    transition: "transform 0.1s, color 0.3s",
                  }}
                >
                  {countdownSecond}
                </div>
              )}

              {/* ANSWER CHOICES */}
              {(isCountdownPhase || isRevealPhase) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  {currentQuestion.answers.map((answer, i) => {
                    const isCorrect = answer.isCorrect;
                    const showResult = isRevealPhase;
                    const answerDelay = i * 0.08;
                    const answerEntrance = spring({
                      frame: Math.max(0, (timeInCurrentQuestion - LYRIC_PHASE - QUESTION_PHASE - answerDelay) * fps),
                      fps,
                      config: { damping: 8, stiffness: 180, mass: 0.4 },
                    });

                    let bgColor = "rgba(255,255,255,0.1)";
                    let borderColor = "rgba(255,255,255,0.25)";
                    let textColor = "#fff";
                    let glowColor = "transparent";

                    if (showResult) {
                      if (isCorrect) {
                        bgColor = `${CORRECT}35`;
                        borderColor = CORRECT;
                        textColor = "#fff";
                        glowColor = `${CORRECT}50`;
                      } else {
                        bgColor = `${WRONG}15`;
                        borderColor = `${WRONG}50`;
                        textColor = `rgba(255,255,255,0.5)`;
                      }
                    }

                    const letters = ["A", "B", "C", "D"];

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          background: bgColor,
                          border: `3px solid ${borderColor}`,
                          borderRadius: 14,
                          padding: "16px 20px",
                          transform: `translateX(${(1 - answerEntrance) * 80}px) scale(${showResult && isCorrect ? 1.02 + Math.sin(frame * 0.15) * 0.02 : 1})`,
                          opacity: answerEntrance,
                          boxShadow: `0 0 25px ${glowColor}`,
                          transition: "background 0.2s, border-color 0.2s",
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 10,
                            background: showResult
                              ? isCorrect ? CORRECT : `${WRONG}60`
                              : `linear-gradient(135deg, ${HL}, ${ACCENT})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 26,
                            fontWeight: 900,
                            color: showResult && !isCorrect ? "#fff" : "#000",
                            fontFamily: FONT,
                            flexShrink: 0,
                            boxShadow: showResult && isCorrect ? `0 0 20px ${CORRECT}60` : "none",
                          }}
                        >
                          {showResult ? (isCorrect ? "✓" : "✗") : letters[i]}
                        </div>

                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: textColor,
                            fontFamily: FONT,
                            textTransform: "uppercase",
                            flex: 1,
                            textDecoration: showResult && !isCorrect ? "line-through" : "none",
                          }}
                        >
                          {answer.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* EXPLANATION on reveal */}
              {isRevealPhase && revealProgress > 0.4 && (
                <div
                  style={{
                    background: `linear-gradient(135deg, ${CORRECT}25, ${CORRECT}10)`,
                    border: `2px solid ${CORRECT}50`,
                    borderRadius: 14,
                    padding: "16px 22px",
                    marginTop: 8,
                    transform: `scale(${spring({
                      frame: Math.max(0, (revealProgress - 0.4) * fps * REVEAL_PHASE),
                      fps,
                      config: { damping: 8, stiffness: 200, mass: 0.4 },
                    })})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#fff",
                      fontFamily: FONT,
                      lineHeight: 1.25,
                    }}
                  >
                    💡 {currentQuestion.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* CONFETTI on correct reveal */}
            {isRevealPhase && confettiParticles.map((p, i) => {
              const fallProgress = revealProgress * p.speed;
              const y = p.startY + fallProgress * 120;
              if (y > 110) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${y}%`,
                    width: p.size,
                    height: p.size * 0.6,
                    background: p.color,
                    borderRadius: 2,
                    transform: `rotate(${p.rotation + frame * p.rotSpeed}deg)`,
                    opacity: interpolate(y, [80, 110], [1, 0], { extrapolateLeft: "clamp" }),
                  }}
                />
              );
            })}

            {/* Flash on reveal */}
            {isRevealPhase && revealProgress < 0.2 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 50% 40%, ${CORRECT}70 0%, transparent 50%)`,
                  opacity: interpolate(revealProgress, [0, 0.2], [0.7, 0], { extrapolateRight: "clamp" }),
                  pointerEvents: "none",
                }}
              />
            )}
          </AbsoluteFill>
        )}

        {/* === OUTRO === */}
        {isOutro && (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 700,
                height: 700,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${HL}40 0%, ${ACCENT}20 40%, transparent 60%)`,
                opacity: pulse,
                filter: "blur(60px)",
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
                  fontSize: 68,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: FONT,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  textShadow: "0 4px 30px rgba(0,0,0,0.6)",
                  marginBottom: 15,
                }}
              >
                T'AS EU COMBIEN ?
              </div>

              {/* Score mystery */}
              <div
                style={{
                  fontSize: 150,
                  fontWeight: 900,
                  color: HL,
                  fontFamily: FONT,
                  lineHeight: 1,
                  textShadow: `0 0 60px ${HL}80, 0 0 120px ${HL}40`,
                  marginBottom: 25,
                  transform: `scale(${1 + Math.sin(frame * 0.1) * 0.05})`,
                }}
              >
                ?/{totalQuestions}
              </div>

              {/* CTA Commente - TRÈS visible */}
              <div style={{ position: "relative", marginBottom: 15 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: -12,
                    borderRadius: 24,
                    border: `4px solid ${HL}`,
                    opacity: 0.4 + Math.sin(frame * 0.18) * 0.4,
                    transform: `scale(${1 + Math.sin(frame * 0.18) * 0.1})`,
                  }}
                />
                <div
                  style={{
                    background: `linear-gradient(135deg, ${HL}, ${ACCENT})`,
                    borderRadius: 18,
                    padding: "24px 50px",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    boxShadow: `0 0 70px ${HL}70, 0 0 120px ${HL}30`,
                    transform: `scale(${1 + Math.sin(frame * 0.14) * 0.06})`,
                    border: "3px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <span style={{ fontSize: 50, transform: `translateX(${Math.sin(frame * 0.25) * 8}px)` }}>
                    👇
                  </span>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      color: "#000",
                      fontFamily: FONT,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    COMMENTE !
                  </div>
                  <span style={{ fontSize: 50, transform: `translateX(${-Math.sin(frame * 0.25) * 8}px)` }}>
                    👇
                  </span>
                </div>
              </div>

              {/* Subscribe */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#ff0000",
                  borderRadius: 14,
                  padding: "14px 40px",
                  boxShadow: "0 0 50px rgba(255,0,0,0.5)",
                  transform: `scale(${1 + Math.sin(frame * 0.12) * 0.04})`,
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                </svg>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    color: "#fff",
                    fontFamily: FONT,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  ABONNE-TOI
                </div>
              </div>

              {/* Teaser for next */}
              <div
                style={{
                  marginTop: 30,
                  fontSize: 26,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  opacity: spring({
                    frame: Math.max(0, outroFrame - 30),
                    fps,
                    config: { damping: 10, stiffness: 100, mass: 0.5 },
                  }),
                }}
              >
                PROCHAIN QUIZ ENCORE PLUS DUR 🔥
              </div>
            </div>
          </AbsoluteFill>
        )}
      </div>

      {/* === AUDIO === */}
      {data.audioFile && <Audio src={staticFile(data.audioFile)} volume={0.35} />}
    </AbsoluteFill>
  );
};
