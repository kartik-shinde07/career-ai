// imports for react react-router lucide-react icons and api service below this code block
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  HelpCircle,
  Tag,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import { PREVIEW_ACTIVE_QUESTIONS } from "../services/previewData";

// evaluation animation stages definition below this code block
const EVAL_STEPS = [
  "Evaluating your responses against the 100-point rubric...",
  "Scoring Technical Accuracy (max 40 pts) & Relevance (max 25 pts)...",
  "Analyzing Clarity & Communication (max 20 pts) & Completeness (max 15 pts)...",
  "Generating actionable feedback and suggested improved answers...",
  "Finalizing authoritative scores and report...",
];

// active interview sequential q&a component below this code block (ACT-001 to ACT-004, EVAL-001 to EVAL-005)
export const ActiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // interview session and loading state variables below this code block
  const [interviewData, setInterviewData] = useState(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(
    Boolean(id && id !== "int_session_001"),
  );
  const [fetchError, setFetchError] = useState("");

  // sequential question tracking and draft answer state below this code block
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [validationError, setValidationError] = useState("");
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");

  // ai evaluation loading and error recovery state variables below this code block
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStepIndex, setEvalStepIndex] = useState(0);
  const [evalError, setEvalError] = useState("");
  const evalTimerRef = useRef(null);

  // fetch interview session data on mount and handle completed redirection below this code block (ACT-001, REPORT-002)
  useEffect(() => {
    // fallback gracefully to preview mock session if dummy preview id is provided below this code block
    if (!id || id === "int_session_001") {
      const initial = {};
      PREVIEW_ACTIVE_QUESTIONS.forEach((q, idx) => {
        initial[idx] = q.draftAnswer || "";
      });
      setAnswers(initial);
      setIsLoadingInterview(false);
      return;
    }

    const fetchSession = async () => {
      setIsLoadingInterview(true);
      setFetchError("");

      try {
        const response = await api.get(`/interviews/${id}`);
        if (response.data?.success && response.data?.interview) {
          const session = response.data.interview;

          // redirect immediately to report if interview is already completed below this code block (REPORT-002)
          if (session.status === "completed") {
            navigate(`/interview/${id}/report`, { replace: true });
            return;
          }

          setInterviewData(session);

          // pre-fill any answers previously saved in mongodb subdocuments below this code block (ACT-003)
          const populatedAnswers = {};
          if (Array.isArray(session.questions)) {
            session.questions.forEach((q, idx) => {
              populatedAnswers[idx] = q.userAnswer || "";
            });
          }
          setAnswers(populatedAnswers);

          // locate first unanswered question or resume at saved current index below this code block (ACT-003)
          if (Array.isArray(session.questions)) {
            const firstUnansweredIndex = session.questions.findIndex(
              (q) => !q.userAnswer || q.userAnswer.trim().length < 5,
            );

            if (firstUnansweredIndex !== -1) {
              setCurrentIndex(firstUnansweredIndex);
            } else if (
              typeof session.currentQuestionIndex === "number" &&
              session.currentQuestionIndex < session.questions.length
            ) {
              setCurrentIndex(session.currentQuestionIndex);
            }
          }

          // if session was previously marked as evaluation_failed, notify user with recovery panel below this code block (ERR-003, EVAL-005)
          if (session.status === "evaluation_failed") {
            setEvalError(
              "Previous evaluation could not be completed. Your saved answers are intact. Click 'Retry Evaluation' to submit again.",
            );
          }
        }
      } catch (err) {
        console.warn(
          "[ActiveInterview] Live session fetch error:",
          err.response?.data?.message || err.message,
        );
        setFetchError(
          err.response?.data?.message ||
            "Unable to connect to interview session. Reverting to preview data.",
        );

        const initial = {};
        PREVIEW_ACTIVE_QUESTIONS.forEach((q, idx) => {
          initial[idx] = q.draftAnswer || "";
        });
        setAnswers(initial);
      } finally {
        setIsLoadingInterview(false);
      }
    };

    fetchSession();

    // cleanup timer on unmount below this code block
    return () => {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
    };
  }, [id, navigate]);

  // determine active questions list from live database session or preview data below this code block
  const questions =
    interviewData &&
    Array.isArray(interviewData.questions) &&
    interviewData.questions.length > 0
      ? interviewData.questions
      : PREVIEW_ACTIVE_QUESTIONS;

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentIndex] || "";

  // calculate answer metrics character count word count and progress percentage below this code block
  const trimmedAnswer = currentAnswer.trim();
  const wordCount = trimmedAnswer ? trimmedAnswer.split(/\s+/).length : 0;
  const charCount = currentAnswer.length;
  const answeredCount = Object.values(answers).filter(
    (ans) => ans && ans.trim().length >= 5,
  ).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // handle text input changes with draft preservation below this code block (ACT-003)
  const handleAnswerChange = (e) => {
    setValidationError("");
    setSaveFeedback("");
    const newText = e.target.value;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: newText,
    }));
  };

  // save single answer to backend database endpoint below this code block (ACT-001, ACT-002, ACT-003)
  const saveCurrentAnswerToBackend = async (questionNum, answerText) => {
    // skip network call if in mock preview mode below this code block
    if (!id || id === "int_session_001") {
      return true;
    }

    const response = await api.patch(`/interviews/${id}/answer`, {
      questionNumber: questionNum,
      userAnswer: answerText,
    });

    if (response.data?.success && response.data?.interview) {
      setInterviewData(response.data.interview);
      return true;
    }
    return false;
  };

  // trigger groq ai evaluation with automated step timer below this code block (EVAL-001, EVAL-005)
  const triggerAiEvaluation = async () => {
    setIsEvaluating(true);
    setEvalError("");
    setEvalStepIndex(0);

    // start animated progress stage sequence below this code block
    if (evalTimerRef.current) clearInterval(evalTimerRef.current);
    let step = 0;
    evalTimerRef.current = setInterval(() => {
      step = (step + 1) % EVAL_STEPS.length;
      setEvalStepIndex(step);
    }, 2500);

    try {
      // preview mode mock evaluation timeout handler below this code block
      if (!id || id === "int_session_001") {
        setTimeout(() => {
          if (evalTimerRef.current) clearInterval(evalTimerRef.current);
          setIsEvaluating(false);
          navigate(`/interview/${id || "int_session_001"}/report`);
        }, 3500);
        return;
      }

      // invoke backend evaluation route with extended 60s timeout below this code block (EVAL-001, EVAL-005)
      const evalResponse = await api.post(
        `/interviews/${id}/evaluate`,
        {},
        { timeout: 60000 },
      );

      if (evalTimerRef.current) clearInterval(evalTimerRef.current);

      if (evalResponse.data?.success) {
        setIsEvaluating(false);
        navigate(`/interview/${id}/report`);
      } else {
        throw new Error(
          evalResponse.data?.message || "Evaluation response was unsuccessful.",
        );
      }
    } catch (err) {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
      setIsEvaluating(false);
      console.error(
        "[ActiveInterview] Evaluation request failed:",
        err.response?.data?.message || err.message,
      );

      // preserve typed text and render error recovery panel below this code block (ERR-002, EVAL-005)
      setEvalError(
        err.response?.data?.message ||
          "AI evaluation service encountered a temporary error. Your answers have been preserved safely. Click 'Retry Evaluation' to re-run.",
      );
    }
  };

  // handle next question submission with non-empty validation below this code block (ACT-002)
  const handleNext = async () => {
    // 1. validate substantive answer length constraints (at least 5 characters) below this code block (ACT-002)
    if (!trimmedAnswer || trimmedAnswer.length < 5) {
      setValidationError(
        "Please enter a substantive answer (at least 5 characters) before proceeding.",
      );
      return;
    }

    setValidationError("");
    setIsSavingAnswer(true);

    try {
      const qNum = currentQuestion.questionNumber || currentIndex + 1;
      await saveCurrentAnswerToBackend(qNum, currentAnswer);

      // advance sequentially to next question index below this code block (ACT-001)
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSaveFeedback("Answer saved.");
        setTimeout(() => setSaveFeedback(""), 2000);
      } else {
        // on the final question, initiate evaluation pipeline below this code block (ACT-004)
        await triggerAiEvaluation();
      }
    } catch (saveErr) {
      console.error(
        "[ActiveInterview] Save answer failure:",
        saveErr.response?.data?.message || saveErr.message,
      );
      // preserve draft answer inside textarea and show user-friendly error below this code block (ACT-003)
      setValidationError(
        saveErr.response?.data?.message ||
          "Failed to save your response to the server. Your typed text has been preserved. Please check your network and try again.",
      );
    } finally {
      setIsSavingAnswer(false);
    }
  };

  // handle previous question navigation below this code block
  const handlePrev = () => {
    setValidationError("");
    setSaveFeedback("");
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // render loading spinner while fetching live session below this code block
  if (isLoadingInterview) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-app-accent" />
        <p className="text-sm font-semibold text-app-text-muted">
          Loading your personalized interview session...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative text-slate-900 dark:text-slate-100">
      {/* ai evaluation loading overlay with dynamic rubric status text below this code block */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface p-8 max-w-md w-full text-center space-y-6 shadow-2xl border-2 border-app-accent">
            <div className="w-16 h-16 rounded-2xl bg-app-accent flex items-center justify-center text-white mx-auto shadow-lg shadow-app-accent/30 animate-pulse">
              <Brain className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-app-text-primary">
                Evaluating Interview Responses
              </h3>
              <p className="text-xs text-app-text-muted">
                Groq AI is grading your answers across the transparent 100-point
                weighted rubric
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-app-muted border border-app-border text-xs font-mono font-medium text-app-accent flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{EVAL_STEPS[evalStepIndex]}</span>
            </div>

            <div className="w-full bg-app-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-app-accent h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round(((evalStepIndex + 1) / EVAL_STEPS.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* error recovery panel when evaluation fails with retry button below this code block (ERR-002, EVAL-005) */}
      {evalError && (
        <div className="p-4 rounded-xl bg-status-weak/10 border-2 border-status-weak/30 text-app-text-primary space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-status-weak shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-status-weak">
                Evaluation Service Notice
              </h4>
              <p className="text-xs text-app-text-muted leading-relaxed">
                {evalError}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={triggerAiEvaluation}
              disabled={isEvaluating}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-2 font-semibold shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`}
              />
              <span>Retry Evaluation</span>
            </button>
            <span className="text-[11px] text-app-text-muted">
              All your submitted answers remain safely stored.
            </span>
          </div>
        </div>
      )}

      {/* fetch error notification banner if live session load failed below this code block */}
      {fetchError && (
        <div className="p-3.5 rounded-lg bg-status-weak/10 border border-status-weak/20 text-status-weak text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* top progress bar metadata badges and question stepper below this code block (ACT-001) */}
      <div className="card-surface p-5 space-y-4 shadow-xs">
        {/* session metadata and current question index badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-primary font-mono text-xs">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="badge badge-moderate text-xs">
              {interviewData?.category ||
                currentQuestion.category ||
                "Technical"}{" "}
              Track
            </span>
            <span className="badge badge-primary text-xs">
              {interviewData?.difficulty ||
                currentQuestion.difficulty ||
                "Intermediate"}
            </span>
            <span className="text-xs text-app-text-muted hidden md:inline">
              •{" "}
              {interviewData?.targetRole ||
                currentQuestion.targetRole ||
                "Full Stack Developer"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-app-text-muted font-mono self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-app-accent" />
            <span>
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>
        </div>

        {/* progress bar visual line */}
        <div className="w-full bg-app-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-app-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* question stepper navigation pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {questions.map((q, idx) => {
            const hasAnswer =
              answers[idx] && answers[idx].trim().length >= 5;
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.questionNumber || q.id || idx}
                type="button"
                onClick={() => {
                  setValidationError("");
                  setSaveFeedback("");
                  setCurrentIndex(idx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-app-accent text-white shadow-xs"
                    : hasAnswer
                      ? "bg-status-strong/15 text-status-strong border border-status-strong/30 hover:bg-status-strong/20"
                      : "bg-app-muted text-app-text-muted hover:text-app-text-primary"
                }`}
              >
                <span>Q{idx + 1}</span>
                {hasAnswer && <Check className="w-3 h-3 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* current question prompt card below this code block */}
      <div className="card-surface p-6 sm:p-8 space-y-4 shadow-sm border-l-4 border-l-app-accent">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary text-[10px] font-mono">
            {currentQuestion.topicTag || "General"}
          </span>
          <span className="text-xs text-app-text-muted">
            •{" "}
            {interviewData?.difficulty ||
              currentQuestion.difficulty ||
              "Intermediate"}{" "}
            Tier
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-app-text-primary leading-relaxed">
          {currentQuestion.questionText}
        </h2>
      </div>

      {/* answer textarea input area with word and character statistics below this code block (ACT-002, ACT-003) */}
      <div className="card-surface p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <label
            htmlFor="userAnswer"
            className="text-xs font-semibold text-app-text-muted"
          >
            Your Response
          </label>
          <div className="flex items-center gap-3 text-xs font-mono text-app-text-muted">
            <span>{wordCount} words</span>
            <span>•</span>
            <span
              className={charCount > 5000 ? "text-status-weak font-bold" : ""}
            >
              {charCount} / 5000 chars
            </span>
          </div>
        </div>

        <textarea
          id="userAnswer"
          rows={9}
          value={currentAnswer}
          onChange={handleAnswerChange}
          placeholder="Articulate your structured response here. Provide concrete explanations, problem-solving methodologies, architecture decisions, or STAR framework examples..."
          className={`w-full p-4 rounded-xl border bg-app-card text-app-text-primary text-sm font-sans focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors resize-y leading-relaxed ${
            validationError
              ? "border-status-weak focus:ring-status-weak"
              : "border-app-border"
          }`}
        />

        {/* inline validation warning message below this code block (ACT-002) */}
        {validationError && (
          <div className="p-3 rounded-lg bg-status-weak/10 border border-status-weak/20 text-status-weak text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* subtle answer saved notification below this code block */}
        {saveFeedback && (
          <div className="p-2.5 rounded-lg bg-status-strong/10 border border-status-strong/20 text-status-strong text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* bottom navigation actions toolbar below this code block */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isSavingAnswer || isEvaluating}
            className={`btn-outline text-xs py-2 px-4 flex items-center gap-2 font-semibold ${
              currentIndex === 0 || isSavingAnswer || isEvaluating
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSavingAnswer || isEvaluating}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-2 font-semibold shadow-xs"
          >
            {isSavingAnswer ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : currentIndex === totalQuestions - 1 ? (
              <>
                <span>Submit for Evaluation</span>
                <Send className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Save & Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// default export below this code block
export default ActiveInterview;
