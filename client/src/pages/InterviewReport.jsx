// imports for react react-router lucide icons api service and sample report data below this code block
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Target,
  Zap,
  Brain,
  Layers,
  AlertTriangle,
  Play,
  Info,
  ShieldCheck,
  BookOpen,
  Loader2,
} from "lucide-react";
import api from "../services/api";
import { PREVIEW_REPORT_DATA } from "../services/previewData";
import { usePreview } from "../context/PreviewContext";

// interview evaluation report page component below this code block (REPORT-001, REPORT-002, REPORT-003)
export const InterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { previewMode } = usePreview();

  // local component state variables below this code block
  const [interviewData, setInterviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(
    Boolean(id && id !== "int_session_001"),
  );
  const [isRetryingEval, setIsRetryingEval] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState(null);
  const [mockStatusOverride, setMockStatusOverride] = useState("completed");

  // fetch live completed interview report from backend database on mount below this code block (REPORT-001, REPORT-002)
  useEffect(() => {
    // skip network request when in mock preview mode or preview dummy id is used below this code block
    if (!id || id === "int_session_001") {
      setIsLoading(false);
      return;
    }

    const loadReport = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const response = await api.get(`/interviews/${id}`);
        if (response.data?.success && response.data?.interview) {
          setInterviewData(response.data.interview);
        }
      } catch (err) {
        console.warn(
          "[InterviewReport] Failed to fetch live report:",
          err.response?.data?.message || err.message,
        );
        setFetchError(
          err.response?.data?.message ||
            "Could not load live interview report. Please verify session ownership or return to history.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id]);

  // retry evaluation trigger when interview is in evaluation_failed status below this code block (EVAL-005, ERR-003)
  const handleRetryEvaluation = async () => {
    if (!id || id === "int_session_001") {
      setMockStatusOverride("completed");
      return;
    }

    setIsRetryingEval(true);
    setFetchError("");

    try {
      const response = await api.post(
        `/interviews/${id}/evaluate`,
        {},
        { timeout: 60000 },
      );
      if (response.data?.success && response.data?.interview) {
        setInterviewData(response.data.interview);
      }
    } catch (err) {
      console.error(
        "[InterviewReport] Retry evaluation failed:",
        err.response?.data?.message || err.message,
      );
      setFetchError(
        err.response?.data?.message ||
          "Evaluation retry failed. Please try again in a few moments.",
      );
    } finally {
      setIsRetryingEval(false);
    }
  };

  // handle copy model answer to clipboard below this code block
  const handleCopy = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(idx);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  // render loading spinner while fetching live report below this code block
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-app-accent" />
        <p className="text-sm font-semibold text-app-text-muted">
          Loading your evaluation report...
        </p>
      </div>
    );
  }

  // error state handler when session cannot be loaded below this code block
  if (fetchError && !interviewData && id && id !== "int_session_001") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <div className="card-surface p-8 space-y-4 shadow-md border-status-weak/30">
          <div className="w-14 h-14 rounded-2xl bg-status-weak/15 text-status-weak flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-app-text-primary">
            Unable to Load Interview Report
          </h2>
          <p className="text-xs sm:text-sm text-app-text-muted max-w-md mx-auto leading-relaxed">
            {fetchError}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/history" className="btn-primary text-xs py-2 px-5 font-semibold">
              Back to History
            </Link>
            <Link to="/interview/new" className="btn-outline text-xs py-2 px-4">
              Start New Interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // calculate answered question count and total count below this code block
  const answeredCount = interviewData?.questions
    ? interviewData.questions.filter(
        (q) => q.userAnswer && q.userAnswer.trim().length >= 5,
      ).length
    : 0;
  const totalCount =
    interviewData?.questionCount || interviewData?.questions?.length || 5;
  const progressPercent = Math.min(
    100,
    Math.round((answeredCount / totalCount) * 100),
  );

  // determine effective session status checking live database first then mock override below this code block
  const currentStatus =
    interviewData?.status ||
    (id && id !== "int_session_001" ? "completed" : mockStatusOverride);

  // guard state: in_progress session handler below this code block (REPORT-002)
  if (currentStatus === "in_progress") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <div className="card-surface p-8 space-y-4 shadow-md border-amber-500/30">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-app-text-primary">
            Interview In Progress ({answeredCount} of {totalCount} Answered)
          </h2>
          <p className="text-xs sm:text-sm text-app-text-muted max-w-md mx-auto leading-relaxed">
            This interview session is currently in progress. Complete answering
            all questions to generate your full 100-point rubric evaluation
            report.
          </p>
          {/* visual progress bar indicator below this code block */}
          <div className="max-w-md mx-auto space-y-1.5 py-1">
            <div className="flex items-center justify-between text-xs text-app-text-muted">
              <span>Progress</span>
              <span className="font-mono font-semibold">
                {answeredCount} of {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-app-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/interview/${id || "int_session_001"}/session`}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-2 font-semibold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Interview</span>
            </Link>
            <Link to="/history" className="btn-outline text-xs py-2 px-4">
              Back to History
            </Link>
            {(!id || id === "int_session_001") && (
              <button
                type="button"
                onClick={() => setMockStatusOverride("completed")}
                className="btn-outline text-xs py-2 px-4"
              >
                Simulate Completed State
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // guard state: evaluation_failed session handler below this code block (REPORT-002, EVAL-005)
  if (currentStatus === "evaluation_failed") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <div className="card-surface p-8 space-y-4 shadow-md border-status-weak/30">
          <div className="w-14 h-14 rounded-2xl bg-status-weak/15 text-status-weak flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-status-weak">
            AI Evaluation Failed
          </h2>
          <p className="text-xs sm:text-sm text-app-text-muted max-w-md mx-auto leading-relaxed">
            Your submitted answers are preserved safely, but an error occurred
            while evaluating them against the Groq AI scoring model.
          </p>
          {fetchError && (
            <div className="p-3 rounded-lg bg-status-weak/10 text-status-weak text-xs">
              {fetchError}
            </div>
          )}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetryEvaluation}
              disabled={isRetryingEval}
              className="btn-primary text-xs py-2 px-5 flex items-center gap-2 font-semibold"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRetryingEval ? "animate-spin" : ""}`}
              />
              <span>
                {isRetryingEval ? "Evaluating..." : "Retry Evaluation"}
              </span>
            </button>
            <Link to="/history" className="btn-outline text-xs py-2 px-4">
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // transform live interview data into report structure or fallback to preview data below this code block
  const report = interviewData
    ? {
        role: interviewData.targetRole,
        experienceLevel: interviewData.experienceLevel,
        category: interviewData.category,
        difficulty: interviewData.difficulty,
        date: new Date(
          interviewData.completedAt || interviewData.updatedAt,
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        questionCount: interviewData.questions.length,
        overallScore: interviewData.overallScore ?? 0,
        criteria: [
          {
            name: "Technical Accuracy",
            score: interviewData.criterionAverages?.technicalAccuracy ?? 0,
            maxScore: 40,
            weight: "40%",
            percentage: Math.min(
              100,
              Math.round(
                ((interviewData.criterionAverages?.technicalAccuracy ?? 0) /
                  40) *
                  100,
              ),
            ),
            color: "#6366F1",
          },
          {
            name: "Relevance",
            score: interviewData.criterionAverages?.relevance ?? 0,
            maxScore: 25,
            weight: "25%",
            percentage: Math.min(
              100,
              Math.round(
                ((interviewData.criterionAverages?.relevance ?? 0) / 25) * 100,
              ),
            ),
            color: "#10B981",
          },
          {
            name: "Clarity & Communication",
            score: interviewData.criterionAverages?.clarity ?? 0,
            maxScore: 20,
            weight: "20%",
            percentage: Math.min(
              100,
              Math.round(
                ((interviewData.criterionAverages?.clarity ?? 0) / 20) * 100,
              ),
            ),
            color: "#F59E0B",
          },
          {
            name: "Completeness",
            score: interviewData.criterionAverages?.completeness ?? 0,
            maxScore: 15,
            weight: "15%",
            percentage: Math.min(
              100,
              Math.round(
                ((interviewData.criterionAverages?.completeness ?? 0) / 15) *
                  100,
              ),
            ),
            color: "#EC4899",
          },
        ],
        strengths: interviewData.summaryFeedback?.keyStrengths?.length
          ? interviewData.summaryFeedback.keyStrengths
          : ["Clear structure and confident delivery in answers."],
        weaknesses: interviewData.summaryFeedback?.keyWeaknesses?.length
          ? interviewData.summaryFeedback.keyWeaknesses
          : [
              "Incorporate more real-world examples and trade-off considerations.",
            ],
        practiceTopics: interviewData.summaryFeedback?.topicsToPractice?.length
          ? interviewData.summaryFeedback.topicsToPractice
          : [interviewData.category, interviewData.targetRole],
        questions: interviewData.questions.map((q, idx) => ({
          number: q.questionNumber || idx + 1,
          question: q.questionText,
          topicTag: q.topicTag || "General",
          userAnswer: q.userAnswer || "(No answer recorded)",
          score: q.evaluation?.questionScore ?? 0,
          subScores: {
            technical: q.evaluation?.technicalAccuracy ?? 0,
            relevance: q.evaluation?.relevance ?? 0,
            clarity: q.evaluation?.clarity ?? 0,
            completeness: q.evaluation?.completeness ?? 0,
          },
          feedback:
            q.evaluation?.feedback ||
            "Answer evaluated according to 100-point rubric.",
          strengths: q.evaluation?.strengths || [],
          improvements: q.evaluation?.improvements || [],
          improvedAnswer:
            q.evaluation?.suggestedAnswer ||
            "A model answer includes structured reasoning, concrete code or architectural examples, and edge case discussion.",
          topicsToPractice: q.evaluation?.topicsToPractice || [],
        })),
      }
    : PREVIEW_REPORT_DATA;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
      {/* report header banner below this code block */}
      <div className="card-surface p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs border-l-4 border-l-app-accent">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge badge-strong">Evaluation Completed</span>
            <span className="badge badge-primary">{report.category} Track</span>
            <span className="badge badge-primary">{report.difficulty}</span>
            <span className="text-xs text-app-text-muted">• {report.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text-primary">
            Interview Performance Report
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
            Target Role:{" "}
            <strong className="text-app-text-primary">{report.role}</strong> (
            {report.experienceLevel} Tier) • {report.questionCount} Questions
            Evaluated
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {(!id || id === "int_session_001") && (
            <select
              value={mockStatusOverride}
              onChange={(e) => setMockStatusOverride(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg border border-app-border bg-app-card text-app-text-muted"
              title="Preview guard states (REPORT-002)"
            >
              <option value="completed">Status: Completed</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="evaluation_failed">Status: Failed</option>
            </select>
          )}

          <Link
            to="/interview/new"
            className="btn-primary text-xs py-2 px-4 shadow-sm font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Link>
        </div>
      </div>

      {/* score summary and criterion breakdown card below this code block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* overall 100-point score card (4 cols) */}
        <div className="md:col-span-4 card-surface p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">
            Overall Score
          </p>
          <div
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${
              report.overallScore >= 75
                ? "border-status-strong bg-status-strong/5 text-status-strong"
                : report.overallScore >= 50
                  ? "border-status-moderate bg-status-moderate/5 text-status-moderate"
                  : "border-status-weak bg-status-weak/5 text-status-weak"
            }`}
          >
            <span className="text-4xl font-extrabold font-mono">
              {report.overallScore}
            </span>
            <span className="text-[11px] text-app-text-muted font-mono font-medium">
              / 100
            </span>
          </div>
          <span
            className={`badge mt-4 text-xs ${
              report.overallScore >= 75
                ? "badge-strong"
                : report.overallScore >= 50
                  ? "badge-moderate"
                  : "bg-status-weak/15 text-status-weak"
            }`}
          >
            {report.overallScore >= 75
              ? "Strong Performance"
              : report.overallScore >= 50
                ? "Moderate Performance"
                : "Needs Practice"}
          </span>
          <p className="text-[11px] text-app-text-muted mt-2">
            Authoritative 100-point rubric mean
          </p>
        </div>

        {/* 4 criterion bars breakdown (8 cols) below this code block */}
        <div className="md:col-span-8 card-surface p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-app-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-app-text-muted">
              100-Point Weighted Rubric Breakdown
            </h2>
            <span className="text-[11px] text-app-text-muted font-mono">
              Overall = {report.overallScore} / 100
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {report.criteria.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-app-text-primary flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <span className="text-app-text-muted text-[10px]">
                      ({item.weight})
                    </span>
                  </span>
                  <div className="font-mono text-xs flex items-center gap-2">
                    <span className="font-bold">
                      {item.score} / {item.maxScore}
                    </span>
                    <span className="text-[11px] text-app-text-muted">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-app-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* executive feedback summary grid (strengths, improvement, practice topics) below this code block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* strengths card */}
        <div className="card-surface p-6 border-l-4 border-l-status-strong space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-status-strong">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-sm font-bold tracking-tight text-app-text-primary">
              Key Strengths
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-app-text-muted">
            {report.strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-status-strong font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* weaknesses and improvement areas card */}
        <div className="card-surface p-6 border-l-4 border-l-status-moderate space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-status-moderate">
            <Lightbulb className="w-5 h-5" />
            <h3 className="text-sm font-bold tracking-tight text-app-text-primary">
              Areas for Growth
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-app-text-muted">
            {report.weaknesses.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-status-moderate font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* recommended practice topics */}
        <div className="card-surface p-6 border-l-4 border-l-indigo-500 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-500">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-sm font-bold tracking-tight text-app-text-primary">
              Recommended Study
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-app-text-muted">
            {report.practiceTopics.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* question-by-question expandable breakdown cards below this code block */}
      <div className="card-surface p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <div>
            <h2 className="text-base font-bold tracking-tight text-app-text-primary">
              Question-by-Question Evaluation
            </h2>
            <p className="text-xs text-app-text-muted">
              Inspect candidate answer, sub-scores, qualitative critique, and
              model rewrites
            </p>
          </div>
          <span className="text-xs text-app-text-muted">
            Click question to expand
          </span>
        </div>

        <div className="space-y-3">
          {report.questions.map((q, idx) => {
            const isExpanded = expandedQuestion === idx;

            return (
              <div
                key={idx}
                className="border border-app-border rounded-xl overflow-hidden shadow-xs"
              >
                {/* question accordion toggle header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="w-full p-4 bg-app-muted/30 flex items-center justify-between text-left hover:bg-app-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="badge badge-primary font-mono text-xs">
                      Q{q.number}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-app-text-primary line-clamp-1">
                        {q.question}
                      </h4>
                      <p className="text-[11px] text-app-text-muted">
                        {q.topicTag}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="font-mono text-xs font-bold text-status-strong">
                      {q.score} / 100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-app-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-app-text-muted" />
                    )}
                  </div>
                </button>

                {/* question expanded details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5 text-xs bg-app-card border-t border-app-border">
                    {/* subscores strip */}
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-app-muted/50 border border-app-border font-mono text-[11px]">
                      <span>
                        Technical:{" "}
                        <strong>{q.subScores.technical}/40</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Relevance: <strong>{q.subScores.relevance}/25</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Clarity: <strong>{q.subScores.clarity}/20</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Completeness:{" "}
                        <strong>{q.subScores.completeness}/15</strong>
                      </span>
                    </div>

                    {/* candidate submitted response */}
                    <div>
                      <h5 className="font-bold text-app-text-muted uppercase text-[10px] tracking-wider mb-1.5">
                        Your Submitted Response
                      </h5>
                      <div className="p-3.5 rounded-lg bg-app-muted/40 border border-app-border text-app-text-primary leading-relaxed font-sans">
                        {q.userAnswer}
                      </div>
                    </div>

                    {/* ai qualitative critique */}
                    <div>
                      <h5 className="font-bold text-app-text-muted uppercase text-[10px] tracking-wider mb-1.5">
                        AI Evaluator Feedback
                      </h5>
                      <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 leading-relaxed font-sans">
                        {q.feedback}
                      </div>
                    </div>

                    {/* strengths and improvements lists if available */}
                    {((q.strengths && q.strengths.length > 0) ||
                      (q.improvements && q.improvements.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.strengths && q.strengths.length > 0 && (
                          <div className="p-3 rounded-lg bg-status-strong/10 border border-status-strong/20">
                            <span className="font-bold text-status-strong text-[11px] block mb-1">
                              Strengths:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-app-text-muted text-[11px]">
                              {q.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.improvements && q.improvements.length > 0 && (
                          <div className="p-3 rounded-lg bg-status-moderate/10 border border-status-moderate/20">
                            <span className="font-bold text-status-moderate text-[11px] block mb-1">
                              Areas to Polish:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-app-text-muted text-[11px]">
                              {q.improvements.map((imp, iIdx) => (
                                <li key={iIdx}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* recommended study topics for question below this code block */}
                    {q.topicsToPractice && q.topicsToPractice.length > 0 && (
                      <div>
                        <h5 className="font-bold text-app-text-muted uppercase text-[10px] tracking-wider mb-1.5">
                          Topics to Practice
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {q.topicsToPractice.map((topic, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* highlighted suggested improved answer rewrite */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h5 className="font-bold text-emerald-500 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Suggested Model Answer Rewrite</span>
                        </h5>
                        <button
                          type="button"
                          onClick={() => handleCopy(q.improvedAnswer, idx)}
                          aria-label="Copy Suggested Model Answer"
                          className="text-[11px] text-app-accent hover:underline flex items-center gap-1 font-medium"
                        >
                          {copiedQuestionIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-status-strong" />
                              <span className="text-status-strong">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Suggested Answer</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 leading-relaxed font-sans">
                        {q.improvedAnswer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* mandatory educational guidance disclaimer banner below this code block (REPORT-003) */}
      <div className="p-4 rounded-xl bg-app-muted/50 border border-app-border text-xs text-app-text-muted flex items-start gap-3">
        <Info className="w-4 h-4 text-app-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-app-text-primary">
            Educational Guidance Disclaimer:{" "}
          </strong>
          Career AI practice evaluations, rubric scores, and suggested answers
          represent educational assessments generated by AI models for
          placement preparation. Scores do not constitute scientifically
          validated psychometric evaluations or employment guarantees.
        </p>
      </div>
    </div>
  );
};

// default export below this code block
export default InterviewReport;
