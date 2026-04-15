import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Award, RotateCcw } from "lucide-react";
import quizData from "../imports/pasted_text/business-central-quiz.json";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correct?: number;
  correctAnswer?: number;
  explanation: string;
  topic?: string;
}

type QuizState = "quiz" | "results" | "review";

export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizState, setQuizState] = useState<QuizState>("quiz");
  const [sessionSeed, setSessionSeed] = useState(0);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);

  const SESSION_SIZE = 20;
  const allQuestions: Question[] = quizData;

  const questions = useMemo(() => {
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    if (quizState === "review") {
      return reviewQuestions;
    }

    return shuffleArray(allQuestions)
      .slice(0, SESSION_SIZE)
      .map((q) => {
        const originalCorrectIndex = q.correctAnswer ?? q.correct;

        if (
          originalCorrectIndex === undefined ||
          originalCorrectIndex < 0 ||
          originalCorrectIndex >= q.options.length
        ) {
          return q;
        }

        const optionObjects = q.options.map((option, index) => ({
          option,
          isCorrect: index === originalCorrectIndex,
        }));

        const shuffledOptions = shuffleArray(optionObjects);

        return {
          ...q,
          options: shuffledOptions.map((item) => item.option),
          correctAnswer: shuffledOptions.findIndex((item) => item.isCorrect),
        };
      });
  }, [allQuestions, quizState, reviewQuestions, sessionSeed]);

  const progress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Safety check: if questions array is empty or current question is invalid
  if (!questions || questions.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          fontFamily: "Albert Sans, sans-serif",
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h1
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "2rem",
              color: "#1a1a1a",
            }}
          >
            No Questions Available
          </h1>
          <p className="text-gray-600 mt-4">Please check the quiz data.</p>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;

    setSelectedAnswer(index);
    setShowExplanation(true);

    const correctIndex =
      questions[currentQuestion].correctAnswer ??
      questions[currentQuestion].correct;

    if (correctIndex === undefined) {
      console.error(
        "Missing correct answer for question:",
        questions[currentQuestion],
      );
      return;
    }

    const isCorrect = index === correctIndex;
    if (isCorrect) {
      setScore(score + 1);
    }
    setAnswers([...answers, isCorrect]);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizState("results");
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswers([]);
    setReviewQuestions([]);
    setQuizState("quiz");
    setSessionSeed((prev) => prev + 1);
  };

  if (quizState === "results") {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          fontFamily: "Albert Sans, sans-serif",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Award
                className={`w-20 h-20 mx-auto mb-4 ${passed ? "text-emerald-500" : "text-amber-500"}`}
              />
            </motion.div>

            <h1
              className="mb-2"
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "2.5rem",
                color: "#1a1a1a",
              }}
            >
              Quiz Complete!
            </h1>

            <div
              className="text-6xl font-bold mb-2"
              style={{ color: passed ? "#10b981" : "#f59e0b" }}
            >
              {percentage}%
            </div>

            <p className="text-xl text-gray-600">
              {score} out of {questions.length} correct
            </p>
          </div>

          {questions.some((q) => q.topic) && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="mb-4 text-lg" style={{ color: "#1a1a1a" }}>
                Performance by Topic
              </h3>
              {Object.entries(
                questions.reduce(
                  (acc, q, i) => {
                    const topic = q.topic || "General";
                    if (!acc[topic]) acc[topic] = { correct: 0, total: 0 };
                    acc[topic].total++;
                    if (answers[i]) acc[topic].correct++;
                    return acc;
                  },
                  {} as Record<string, { correct: number; total: number }>,
                ),
              ).map(([topic, stats]) => (
                <div key={topic} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-gray-600">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${(stats.correct / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {score < questions.length && (
            <button
              onClick={() => {
                const incorrectQuestions = questions.filter(
                  (_, i) => !answers[i],
                );
                setReviewQuestions(incorrectQuestions);
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setScore(0);
                setAnswers([]);
                setQuizState("review");
              }}
              className="w-full mb-4 bg-white border-2 border-blue-500 text-blue-600 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300"
            >
              Retry Incorrect Questions
            </button>
          )}

          <button
            onClick={resetQuiz}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  // Safety check: if current question is invalid
  if (!currentQ) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          fontFamily: "Albert Sans, sans-serif",
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h1
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: "2rem",
              color: "#1a1a1a",
            }}
          >
            Question Not Found
          </h1>
          <p className="text-gray-600 mt-4">
            Invalid question index: {currentQuestion}
          </p>
          <button
            onClick={resetQuiz}
            className="mt-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            Reset Quiz
          </button>
        </div>
      </div>
    );
  }

  const correctAnswerIndex = currentQ.correctAnswer ?? currentQ.correct;
  if (correctAnswerIndex === undefined) {
    console.error("Missing correct answer for question:", currentQ);
    return null;
  }
  const isCorrect = selectedAnswer === correctAnswerIndex;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        fontFamily: "Albert Sans, sans-serif",
      }}
    >
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h1
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: "2rem",
                color: "#1a1a1a",
              }}
            >
              {quizState === "review"
                ? "Review Incorrect Questions"
                : "Business Central Quiz"}
            </h1>
            <div className="text-right">
              <div className="text-sm text-gray-500">Question</div>
              <div className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
                {currentQuestion + 1}/{questions.length}
              </div>
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />

            <div className="mb-6">
              {currentQ.topic && (
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
                    color: "white",
                  }}
                >
                  {currentQ.topic}
                </span>
              )}

              <h2
                className="text-2xl mb-6"
                style={{
                  color: "#1a1a1a",
                  lineHeight: "1.4",
                }}
              >
                {currentQ.question}
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === correctAnswerIndex;
                const showCorrect = showExplanation && isCorrectAnswer;
                const showIncorrect =
                  showExplanation && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    whileHover={!showExplanation ? { scale: 1.01 } : {}}
                    whileTap={!showExplanation ? { scale: 0.99 } : {}}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden"
                    style={{
                      borderColor: showCorrect
                        ? "#10b981"
                        : showIncorrect
                          ? "#ef4444"
                          : isSelected
                            ? "#3b82f6"
                            : "#e5e7eb",
                      background: showCorrect
                        ? "#f0fdf4"
                        : showIncorrect
                          ? "#fef2f2"
                          : isSelected
                            ? "#eff6ff"
                            : "white",
                      cursor: showExplanation ? "default" : "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#1a1a1a" }}>{option}</span>
                      {showCorrect && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      )}
                      {showIncorrect && (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-6 rounded-xl"
                  style={{
                    background: isCorrect ? "#f0fdf4" : "#fef2f2",
                    border: `2px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4
                        className="font-semibold mb-2"
                        style={{
                          color: isCorrect ? "#059669" : "#dc2626",
                        }}
                      >
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </h4>
                      <p style={{ color: "#374151" }}>{currentQ.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showExplanation && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                {currentQuestion < questions.length - 1
                  ? "Next Question"
                  : "View Results"}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
