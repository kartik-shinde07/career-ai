// imports for react react-router recharts lucide icons api service and theme below this code block
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Sparkles,
  PlusCircle,
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Code2,
  Users2,
  Smile,
  Briefcase,
  Play,
  FileQuestion,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  RefreshCw,
  Eye,
  Inbox
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePreview } from '../context/PreviewContext';
import {
  PREVIEW_KPIS,
  PREVIEW_SCORE_TREND,
  PREVIEW_RECENT_INTERVIEWS,
  PREVIEW_PRACTICE_TOPICS
} from '../services/previewData';
import { SkeletonStatCard, SkeletonChart, Skeleton } from '../components/ui/Skeleton';

// category quick-start configurations below this code block
const QUICK_CATEGORIES = [
  {
    title: 'Technical Interview',
    desc: 'Data structures, backend logic, APIs, and frameworks.',
    icon: Code2,
    category: 'Technical',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10'
  },
  {
    title: 'Behavioral & STAR',
    desc: 'Conflict resolution, leadership, and workplace situations.',
    icon: Smile,
    category: 'Behavioral',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'HR & Culture Fit',
    desc: 'Aspirations, salary discussions, fit, and ethics.',
    icon: Users2,
    category: 'HR',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Role-Based Deep Dive',
    desc: 'Day-to-day scenarios for MERN, Frontend, or Backend.',
    icon: Briefcase,
    category: 'Role-based',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  }
];

// dashboard page component with live backend aggregation integration below this code block (DASH-001 to DASH-004)
export const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { previewMode } = usePreview();

  // state variables for live telemetry data below this code block
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(previewMode !== 'empty' && previewMode !== 'populated');
  const [fetchError, setFetchError] = useState('');

  // fetch live dashboard summary data from backend api below this code block (DASH-001, DASH-002)
  const fetchDashboardData = useCallback(async () => {
    // support mock preview states if explicitly triggered in test suites below this code block
    if (previewMode === 'empty' || previewMode === 'populated') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError('');

    try {
      const response = await api.get('/analytics/summary');
      if (response.data?.success) {
        setAnalyticsData(response.data);
      }
    } catch (err) {
      console.warn('[Dashboard] Live telemetry fetch error:', err.response?.data?.message || err.message);
      setFetchError(err.response?.data?.message || 'Failed to load live dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [previewMode]);

  // trigger fetch on component mount below this code block
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // dynamic user greeting resolution below this code block (DASH-001)
  const currentUserName = user?.name || 'Interview Candidate';

  // resolve active dataset from live api response or preview fallback below this code block
  const isEmptyPreview = previewMode === 'empty';
  const isPopulatedPreview = previewMode === 'populated';

  const kpis = isEmptyPreview
    ? { totalInterviews: 0, completedCount: 0, inProgressCount: 0, averageScore: null, totalQuestionsAnswered: 0, latestScoreDelta: null }
    : isPopulatedPreview
      ? {
          totalInterviews: 6,
          completedCount: PREVIEW_KPIS.completedInterviews,
          inProgressCount: 1,
          averageScore: PREVIEW_KPIS.averageScore,
          totalQuestionsAnswered: PREVIEW_KPIS.questionsAnswered,
          latestScoreDelta: 6.2
        }
      : analyticsData?.kpis || {
          totalInterviews: 0,
          completedCount: 0,
          inProgressCount: 0,
          averageScore: null,
          totalQuestionsAnswered: 0,
          latestScoreDelta: null
        };

  const scoreTrend = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_SCORE_TREND
      : analyticsData?.scoreProgression || [];

  const recentInterviews = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_RECENT_INTERVIEWS
      : analyticsData?.recentInterviews || [];

  const practiceTopics = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_PRACTICE_TOPICS
      : analyticsData?.topTopicsToPractice || [];

  const completedCount = kpis.completedCount || 0;
  const isZeroState = kpis.totalInterviews === 0;

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* greeting and top call-to-action banner below this code block */}
      <div className="card-surface p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm border-l-4 border-l-app-accent">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-app-accent-subtle text-app-accent text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Placement Readiness Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text-primary">
            Welcome back, <span className="text-app-accent">{currentUserName}</span>!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
            Configure mock interviews, practice with sequential Q&A, and review objective 100-point rubric assessments.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="btn-primary py-2.5 px-6 text-sm shrink-0 shadow-md font-semibold flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Interview</span>
        </Link>
      </div>

      {/* error banner if live fetch encountered an issue below this code block */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-status-weak/10 border border-status-weak/20 text-xs text-status-weak flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="underline hover:no-underline font-semibold ml-2 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 core kpi statistics cards below this code block (DASH-001) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            {/* completed interviews card */}
            <div className="card-surface p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Completed Sessions
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-app-text-primary">
                  {completedCount}
                </h3>
                <p className="text-[11px] text-app-text-muted mt-1">
                  {completedCount === 0 ? 'No completed sessions' : `${completedCount} evaluated by Groq AI`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-app-accent/10 text-app-accent flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* average score card */}
            <div className="card-surface p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Average Score
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-status-strong">
                  {kpis.averageScore !== null ? (
                    <>
                      {kpis.averageScore}
                      <span className="text-xs font-sans text-app-text-muted font-normal"> / 100</span>
                    </>
                  ) : (
                    <span className="text-app-text-muted">—</span>
                  )}
                </h3>
                <p className="text-[11px] text-app-text-muted mt-1">
                  {completedCount === 0 ? 'Complete 1st interview' : '100-point rubric mean'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-status-strong/10 text-status-strong flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* questions evaluated card */}
            <div className="card-surface p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Questions Evaluated
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-app-text-primary">
                  {kpis.totalQuestionsAnswered}
                </h3>
                <p className="text-[11px] text-app-text-muted mt-1">
                  {completedCount === 0 ? '0 responses submitted' : `Across ${completedCount} completed sessions`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <FileQuestion className="w-6 h-6" />
              </div>
            </div>

            {/* score progression delta card */}
            <div className="card-surface p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Score Trajectory
                </p>
                <h3 className="text-base sm:text-lg font-bold font-mono mt-1 text-app-text-primary truncate">
                  {completedCount >= 2 && kpis.latestScoreDelta !== null ? (
                    <span className={kpis.latestScoreDelta >= 0 ? 'text-status-strong' : 'text-status-weak'}>
                      {kpis.latestScoreDelta >= 0 ? `+${kpis.latestScoreDelta} pts` : `${kpis.latestScoreDelta} pts`}
                    </span>
                  ) : (
                    <span className="text-app-text-muted font-normal text-xs">Need 2+ sessions</span>
                  )}
                </h3>
                <p className="text-[11px] text-app-text-muted mt-1">
                  {completedCount >= 2 ? 'Latest session vs previous' : 'Complete 2+ sessions'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* score progression trend chart card below this code block (DASH-002) */}
      <div className="card-surface p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-app-border">
          <div>
            <h2 className="text-base font-bold tracking-tight text-app-text-primary">Score Progression Over Time</h2>
            <p className="text-xs text-app-text-muted">
              Chronological score changes across completed interview sessions
            </p>
          </div>
          {completedCount >= 2 && kpis.latestScoreDelta !== null && (
            <span className={`badge font-mono text-xs ${kpis.latestScoreDelta >= 0 ? 'badge-strong' : 'badge-weak'}`}>
              {kpis.latestScoreDelta >= 0 ? `+${kpis.latestScoreDelta} pts delta` : `${kpis.latestScoreDelta} pts delta`}
            </span>
          )}
        </div>

        {isLoading ? (
          <SkeletonChart height="h-64" />
        ) : completedCount < 2 ? (
          /* honest minimum-data state as per DASH-002 and DASH-004 */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-app-muted/30 rounded-xl border border-dashed border-app-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-app-accent/10 text-app-accent flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-sm text-app-text-primary">Progression Chart Locked</h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Career AI requires at least 2 completed interviews to plot a real score trend line. Complete another session to unlock this chart!
              </p>
            </div>
            <Link to="/interview/new" className="btn-primary text-xs py-2 px-4 shadow-sm font-semibold flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start an Interview</span>
            </Link>
          </div>
        ) : (
          /* recharts area progression chart */
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#6366F1' : '#4F46E5'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={theme === 'dark' ? '#6366F1' : '#4F46E5'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedDate"
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="card-surface p-3 shadow-lg border border-app-border text-xs space-y-1">
                          <p className="font-semibold text-app-text-primary">{data.targetRole || data.role}</p>
                          <p className="text-[11px] text-app-text-muted">{data.category} • {data.dateLabel || data.date}</p>
                          <p className="font-mono font-bold text-app-accent pt-1">
                            Overall Score: {data.overallScore ?? data.score} / 100
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke={theme === 'dark' ? '#6366F1' : '#4F46E5'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* category quick-start cards section below this code block */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-app-text-primary">Quick Start by Category</h2>
            <p className="text-xs text-app-text-muted">Launch a pre-configured mock interview with a single click</p>
          </div>
          <Link to="/interview/new" className="text-xs font-semibold text-app-accent hover:underline flex items-center gap-1">
            <span>Custom Config</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.category}
                to={`/interview/new?category=${encodeURIComponent(cat.category)}`}
                className="card-surface p-5 hover:border-app-accent group transition-all duration-200 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-app-accent transition-colors text-app-text-primary">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-app-text-muted leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-app-border flex items-center justify-between text-xs font-medium text-app-accent">
                  <span>Start 5 Questions</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* recent interviews list and recurring improvement focus areas below this code block (DASH-003) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* recent interviews list (2 cols) */}
        <div className="card-surface p-6 lg:col-span-2 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-app-border">
            <div>
              <h2 className="text-base font-bold tracking-tight text-app-text-primary">Recent Mock Interviews</h2>
              <p className="text-xs text-app-text-muted">Review scores and feedback from recent practice sessions</p>
            </div>
            {recentInterviews.length > 0 && (
              <Link to="/history" className="text-xs font-semibold text-app-accent hover:underline">
                View All History
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : recentInterviews.length === 0 ? (
            /* onboarding empty state as per DASH-004 */
            <div className="p-8 text-center space-y-3 bg-app-muted/20 rounded-xl border border-dashed border-app-border">
              <div className="w-12 h-12 rounded-xl bg-app-accent/15 text-app-accent flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-app-text-primary">No Mock Interviews Found</h3>
                <p className="text-xs text-app-text-muted max-w-sm mx-auto">
                  You haven't practiced any mock interviews yet. Set up your target role to generate your first session.
                </p>
              </div>
              <Link to="/interview/new" className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-2 shadow-sm font-semibold">
                <PlusCircle className="w-4 h-4" />
                <span>Start Your First Interview</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInterviews.map((session) => {
                const sessionId = session._id || session.id;
                const isCompleted = session.status === 'completed';
                const isInProgress = session.status === 'in_progress';
                const isFailed = session.status === 'evaluation_failed';
                const scoreValue = session.overallScore ?? session.score;

                return (
                  <div
                    key={sessionId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-app-muted/30 border border-app-border gap-3 hover:bg-app-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isCompleted
                            ? scoreValue >= 75
                              ? 'bg-status-strong/15 text-status-strong'
                              : 'bg-status-moderate/15 text-status-moderate'
                            : isInProgress
                            ? 'bg-app-accent-subtle text-app-accent'
                            : 'bg-status-weak/15 text-status-weak'
                        }`}
                      >
                        {isCompleted && scoreValue !== null ? scoreValue : isInProgress ? '...' : '!'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-app-text-primary">{session.targetRole || session.role}</h4>
                        <p className="text-xs text-app-text-muted">
                          {session.category} • {session.difficulty} • {session.questionCount} Questions • {session.dateLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {isCompleted ? (
                        <span className="badge badge-strong">Completed</span>
                      ) : isInProgress ? (
                        <span className="badge badge-primary">In Progress</span>
                      ) : (
                        <span className="badge badge-weak">Failed</span>
                      )}

                      {isCompleted ? (
                        <Link
                          to={`/interview/${sessionId}/report`}
                          className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </Link>
                      ) : isInProgress ? (
                        <Link
                          to={`/interview/${sessionId}/session`}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-medium"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/interview/${sessionId}/report`}
                          className="btn-outline text-xs py-1.5 px-3 text-status-weak border-status-weak/30 flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* recurring improvement focus areas (1 col) */}
        <div className="card-surface p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-app-border">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight text-app-text-primary">Recurring Focus Areas</h2>
              <p className="text-xs text-app-text-muted">High-priority topics from your reports</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : practiceTopics.length === 0 ? (
            <div className="p-6 text-center text-xs text-app-text-muted space-y-2">
              <p className="font-semibold text-app-text-primary">No feedback tags yet</p>
              <p>Complete mock interviews to generate personalized study recommendations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {practiceTopics.slice(0, 4).map((topic, idx) => (
                <div key={topic.id || idx} className="p-3.5 rounded-xl bg-app-muted/40 border border-app-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-primary text-[10px]">{topic.category}</span>
                    <span className="text-[10px] text-app-text-muted font-medium">{topic.frequency}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-app-text-primary leading-snug">{topic.topic}</h4>
                  <p className="text-[11px] text-app-text-muted leading-relaxed">{topic.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

// default export below this code block
export default Dashboard;
