// imports for react react-router recharts lucide icons api service and theme below this code block
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Inbox,
  Sparkles,
  Zap,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  FileQuestion
} from 'lucide-react';
import api from '../services/api';
import { usePreview } from '../context/PreviewContext';
import { useTheme } from '../context/ThemeContext';
import {
  PREVIEW_KPIS,
  PREVIEW_SCORE_TREND,
  PREVIEW_CRITERIA_MASTERY,
  PREVIEW_CATEGORY_BREAKDOWN,
  PREVIEW_PRACTICE_TOPICS
} from '../services/previewData';
import { SkeletonStatCard, SkeletonChart, Skeleton } from '../components/ui/Skeleton';

// performance analytics page component with live backend aggregation integration below this code block (ANALYTICS-001 to ANALYTICS-004)
export const Analytics = () => {
  const { previewMode } = usePreview();
  const { theme } = useTheme();

  // state variables for live telemetry data below this code block
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(previewMode !== 'empty' && previewMode !== 'populated');
  const [fetchError, setFetchError] = useState('');

  // fetch live analytics summary data from backend api below this code block (ANALYTICS-001)
  const fetchAnalyticsData = useCallback(async () => {
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
      console.warn('[Analytics] Live telemetry fetch error:', err.response?.data?.message || err.message);
      setFetchError(err.response?.data?.message || 'Failed to load live performance analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [previewMode]);

  // trigger fetch on component mount below this code block
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // resolve active dataset from live api response or preview fallback below this code block
  const isEmptyPreview = previewMode === 'empty';
  const isPopulatedPreview = previewMode === 'populated';

  const kpis = isEmptyPreview
    ? { completedCount: 0, averageScore: null, totalQuestionsAnswered: 0, latestScoreDelta: null }
    : isPopulatedPreview
      ? {
          completedCount: PREVIEW_KPIS.completedInterviews,
          averageScore: PREVIEW_KPIS.averageScore,
          totalQuestionsAnswered: PREVIEW_KPIS.questionsAnswered,
          latestScoreDelta: 6.2
        }
      : {
          completedCount: analyticsData?.kpis?.completedCount ?? 0,
          averageScore: analyticsData?.kpis?.averageScore ?? null,
          totalQuestionsAnswered: analyticsData?.kpis?.totalQuestionsAnswered ?? 0,
          latestScoreDelta: analyticsData?.kpis?.latestScoreDelta ?? null
        };

  const scoreTrend = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_SCORE_TREND
      : (analyticsData?.scoreProgression ?? []);

  const criteriaMastery = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_CRITERIA_MASTERY
      : (analyticsData?.criterionAverages?.list ?? []);

  const categoryBreakdown = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_CATEGORY_BREAKDOWN
      : (analyticsData?.categoryBreakdown ?? []);

  const practiceTopics = isEmptyPreview
    ? []
    : isPopulatedPreview
      ? PREVIEW_PRACTICE_TOPICS
      : (analyticsData?.topTopicsToPractice ?? []);

  const completedCount = kpis?.completedCount ?? 0;
  const strongestCriterionName = analyticsData?.criterionAverages?.strongestCriterion ?? (isPopulatedPreview ? 'Relevance' : null);
  const strongestCriterionPct = analyticsData?.criterionAverages?.strongestPercentage ?? (isPopulatedPreview ? 88 : null);

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* page header banner below this code block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-app-accent-subtle text-app-accent text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Longitudinal Telemetry • Section 24</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text-primary">
            Performance Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
            Track rubric criteria mastery, score progression across practice sessions, and recurring interview gaps.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm shrink-0 flex items-center gap-2 font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Practice Session</span>
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
            onClick={fetchAnalyticsData}
            className="underline hover:no-underline font-semibold ml-2 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* summary kpi row matching dashboard identically below this code block (ANALYTICS-004) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            {/* completed sessions */}
            <div className="card-surface p-5 shadow-xs">
              <p className="text-xs font-semibold text-app-text-muted uppercase">Completed Sessions</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-app-text-primary">
                {completedCount}
              </h3>
              <p className="text-[11px] text-app-text-muted mt-1">
                {completedCount > 0 ? 'Evaluated by Groq AI' : 'No data recorded'}
              </p>
            </div>

            {/* overall average score */}
            <div className="card-surface p-5 shadow-xs">
              <p className="text-xs font-semibold text-app-text-muted uppercase">Overall Average</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-status-strong">
                {kpis.averageScore !== null ? `${kpis.averageScore} / 100` : '—'}
              </h3>
              <p className="text-[11px] text-status-strong flex items-center gap-1 mt-1 font-medium">
                {completedCount >= 2 && kpis.latestScoreDelta !== null ? (
                  <span>
                    {kpis.latestScoreDelta >= 0 ? `+${kpis.latestScoreDelta} pts latest delta` : `${kpis.latestScoreDelta} pts latest delta`}
                  </span>
                ) : completedCount === 1 ? (
                  <span>1 session recorded</span>
                ) : (
                  <span className="text-app-text-muted font-normal">Complete 1st session</span>
                )}
              </p>
            </div>

            {/* total questions evaluated */}
            <div className="card-surface p-5 shadow-xs">
              <p className="text-xs font-semibold text-app-text-muted uppercase">Questions Evaluated</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-app-text-primary">
                {kpis.totalQuestionsAnswered}
              </h3>
              <p className="text-[11px] text-app-text-muted mt-1">
                {completedCount > 0 ? 'Individual rubric grades' : '0 responses submitted'}
              </p>
            </div>

            {/* top performing criterion */}
            <div className="card-surface p-5 shadow-xs">
              <p className="text-xs font-semibold text-app-text-muted uppercase">Top Criterion</p>
              <h3 className="text-lg font-bold mt-1 text-status-strong truncate">
                {strongestCriterionName ? `${strongestCriterionName} (${strongestCriterionPct}%)` : '—'}
              </h3>
              <p className="text-[11px] text-app-text-muted mt-1">
                {strongestCriterionName ? 'Highest normalized mastery' : 'Awaiting session data'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* zero state hero card when user has 0 completed interviews below this code block (ANALYTICS-002) */}
      {!isLoading && completedCount === 0 ? (
        <div className="card-surface p-12 text-center space-y-4 shadow-sm border border-dashed border-app-border">
          <div className="w-14 h-14 rounded-2xl bg-app-accent/15 text-app-accent flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold tracking-tight text-app-text-primary">
              Analytics Telemetry Locked
            </h2>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
              Complete your first mock interview to unlock longitudinal telemetry, criterion-level mastery breakdowns, and category distribution analytics.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/interview/new"
              className="btn-primary text-xs py-2.5 px-6 inline-flex items-center gap-2 shadow-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Your First Interview</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* recharts visualizations grid below this code block (ANALYTICS-001, ANALYTICS-002) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* chart 1: score progression over time */}
            <div className="card-surface p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-app-border">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-app-text-primary">Score Progression Over Time</h2>
                  <p className="text-xs text-app-text-muted">Chronological performance trajectory across mock sessions</p>
                </div>
                {completedCount >= 2 && kpis.latestScoreDelta !== null && (
                  <span className={`badge font-mono text-xs ${kpis.latestScoreDelta >= 0 ? 'badge-strong' : 'badge-weak'}`}>
                    {kpis.latestScoreDelta >= 0 ? `+${kpis.latestScoreDelta} pts` : `${kpis.latestScoreDelta} pts`}
                  </span>
                )}
              </div>

              {isLoading ? (
                <SkeletonChart height="h-64" />
              ) : completedCount < 2 ? (
                /* honest minimum data state as per ANALYTICS-002 */
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-app-muted/30 rounded-xl border border-dashed border-app-border space-y-3">
                  <Inbox className="w-8 h-8 text-app-text-muted" />
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-semibold text-sm text-app-text-primary">Insufficient Trend Data</h4>
                    <p className="text-xs text-app-text-muted leading-relaxed">
                      A minimum of 2 completed interview sessions are required to plot a longitudinal progression line. You currently have 1 completed session.
                    </p>
                  </div>
                  <Link to="/interview/new" className="btn-primary text-xs py-2 px-4 shadow-sm font-semibold flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Practice Another Interview</span>
                  </Link>
                </div>
              ) : (
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsScoreGrad" x1="0" y1="0" x2="0" y2="1">
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
                                  Score: {data.overallScore ?? data.score} / 100
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
                        fill="url(#analyticsScoreGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* chart 2: criterion mastery normalized bar chart */}
            <div className="card-surface p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-app-border">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-app-text-primary">Criterion-Level Mastery</h2>
                  <p className="text-xs text-app-text-muted">Normalized score percentages across the 4 rubric criteria</p>
                </div>
                <span className="text-[11px] text-app-text-muted font-mono">100-pt Rubric</span>
              </div>

              {isLoading ? (
                <SkeletonChart height="h-64" />
              ) : criteriaMastery.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-app-muted/30 rounded-xl border border-dashed border-app-border space-y-3">
                  <Inbox className="w-8 h-8 text-app-text-muted" />
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-semibold text-sm text-app-text-primary">No Rubric Data Yet</h4>
                    <p className="text-xs text-app-text-muted">
                      Complete mock interviews to view your mastery scores across Technical, Relevance, Clarity, and Completeness.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={criteriaMastery} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="criterion"
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
                                <p className="font-semibold text-app-text-primary">{data.name || data.criterion}</p>
                                <p className="text-[11px] text-app-text-muted">Max Weight: {data.weight}</p>
                                <p className="font-mono font-bold text-app-accent pt-1">
                                  Raw: {data.raw ?? data.score} / {data.max ?? data.maxScore} pts ({data.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                        {criteriaMastery.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry?.color || '#6366F1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* category breakdown & top recurring practice topics below this code block (ANALYTICS-003) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* category distribution bar chart (5 cols) */}
            <div className="lg:col-span-5 card-surface p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-app-border">
                <h2 className="text-base font-bold tracking-tight text-app-text-primary">Performance by Category</h2>
                <p className="text-xs text-app-text-muted">Average score achieved in each interview track</p>
              </div>

              {isLoading ? (
                <SkeletonChart height="h-56" />
              ) : categoryBreakdown.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-app-text-muted text-center p-6">
                  Complete category interviews to populate distribution data.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={cat.category || `cat-${idx}`} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-app-text-primary">{cat.category || 'Category'}</span>
                        <div className="font-mono flex items-center gap-2">
                          <span className="text-app-text-muted">{cat.completedCount ?? cat.sessions ?? 0} sessions</span>
                          <span className="font-bold text-app-text-primary">
                            {cat.averageScore !== null && cat.averageScore !== undefined ? `${cat.averageScore}%` : 'No completed sessions'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-app-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.averageScore !== null && cat.averageScore !== undefined ? Math.min(100, Math.max(0, cat.averageScore)) : 0}%`,
                            backgroundColor: cat.color || '#6366F1'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* top recurring practice topics list (7 cols) */}
            <div className="lg:col-span-7 card-surface p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-app-border">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-app-text-primary">Top Recurring Practice Topics</h2>
                  <p className="text-xs text-app-text-muted">Synthesized from identified gaps across completed reports</p>
                </div>
                <BookOpen className="w-4 h-4 text-app-accent" />
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : practiceTopics.length === 0 ? (
                <div className="p-8 text-center text-xs text-app-text-muted space-y-2">
                  <p className="font-semibold text-app-text-primary">No recurring gaps identified</p>
                  <p>Practice interviews to receive aggregated AI recommendations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {practiceTopics.map((topic, idx) => (
                    <div key={topic.id || `topic-${idx}`} className="p-4 rounded-xl bg-app-muted/40 border border-app-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-primary text-[10px]">{topic.category || 'General'}</span>
                        <span className="text-[10px] text-app-text-muted font-medium">{topic.frequency || ''}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-app-text-primary">{topic.topic || 'Practice Area'}</h4>
                      <p className="text-xs text-app-text-muted leading-relaxed">{topic.recommendation || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};

// default export below this code block
export default Analytics;
