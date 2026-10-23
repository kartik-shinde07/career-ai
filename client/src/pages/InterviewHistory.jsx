// imports for react react-router lucide icons api service preview context and skeleton loaders below this code block
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Eye,
  PlusCircle,
  RefreshCw,
  Inbox,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import { usePreview } from '../context/PreviewContext';
import { PREVIEW_RECENT_INTERVIEWS } from '../services/previewData';
import { SkeletonTableRow } from '../components/ui/Skeleton';

// interview history page component for reviewing past sessions and reports below this code block (HIST-001 to HIST-003)
export const InterviewHistory = () => {
  const { previewMode } = usePreview();

  // local filter and search states below this code block
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // data fetching states below this code block
  const [liveSessions, setLiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(previewMode !== 'preview' && previewMode !== 'empty');
  const [fetchError, setFetchError] = useState('');
  const [totalDatabaseCount, setTotalDatabaseCount] = useState(0);

  // fetch interview history from live backend endpoint with query filters below this code block (HIST-001, AUTH-006)
  const fetchInterviews = useCallback(async () => {
    // skip network calls if user has explicitly activated mock preview states below this code block
    if (previewMode === 'empty' || previewMode === 'preview') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError('');

    try {
      const params = { sort: sortBy };
      if (categoryFilter && categoryFilter !== 'All') {
        params.category = categoryFilter;
      }
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter;
      }

      const response = await api.get('/interviews', { params });
      if (response.data?.success) {
        const fetched = response.data.interviews || [];
        setLiveSessions(fetched);
        setTotalDatabaseCount(response.data.count ?? fetched.length);
      }
    } catch (err) {
      console.warn('[InterviewHistory] Live fetch error:', err.response?.data?.message || err.message);
      setFetchError(err.response?.data?.message || 'Failed to load interview history from server.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, sortBy, previewMode]);

  // trigger fetch on mount and whenever filter or sort options change below this code block
  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // reset all filters to default initial values below this code block
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
    setSortBy('newest');
  };

  // select active sessions dataset according to current preview mode below this code block
  const baseSessions = previewMode === 'empty'
    ? []
    : previewMode === 'preview'
      ? PREVIEW_RECENT_INTERVIEWS
      : liveSessions;

  // client-side search filtering by target role below this code block (HIST-003)
  const filteredSessions = baseSessions.filter((session) => {
    const roleText = (session.targetRole || session.role || '').toLowerCase();
    return roleText.includes(searchQuery.toLowerCase().trim());
  });

  // check if any active filter is applied below this code block
  const isFiltered = searchQuery.trim() !== '' || categoryFilter !== 'All' || statusFilter !== 'All' || sortBy !== 'newest';

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">

      {/* page title header below this code block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text-primary">
            Interview History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
            Search, filter, and review all previous mock interview sessions, reports, and ongoing drafts.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm shrink-0 flex items-center gap-2 font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {/* error banner if live fetch encountered an issue below this code block */}
      {fetchError && (
        <div className="p-3 rounded-xl bg-status-weak/10 border border-status-weak/20 text-xs text-status-weak flex items-center justify-between">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={fetchInterviews}
            className="underline hover:no-underline font-semibold ml-2 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* filter search and sorting toolbar card below this code block (HIST-003) */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">

        {/* search input for target role */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by target role..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
        </div>

        {/* filter controls group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">

          {/* category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card text-app-text-primary focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="HR">HR</option>
            <option value="Role-based">Role-based</option>
          </select>

          {/* status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card text-app-text-primary focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="evaluation_failed">Failed</option>
          </select>

          {/* sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card text-app-text-primary focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="score">Highest Score</option>
          </select>

        </div>

      </div>

      {/* sessions table or empty state below this code block (HIST-001 to HIST-003) */}
      <div className="card-surface overflow-hidden shadow-xs">
        {isLoading || previewMode === 'loading' ? (
          <div className="p-4">
            <table className="w-full text-left text-xs">
              <tbody>
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
              </tbody>
            </table>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-app-muted/50 border-b border-app-border text-app-text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Target Role & Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredSessions.map((session) => {
                  const sessionId = session._id || session.id;
                  const roleName = session.targetRole || session.role || 'Interview Candidate';
                  const totalCount = session.questionCount || 5;
                  const answeredCount = session.answeredQuestionCount ?? (session.currentQuestionIndex || 0);
                  const isCompleted = session.status === 'completed';
                  const isInProgress = session.status === 'in_progress';
                  const isFailed = session.status === 'evaluation_failed';
                  const scoreValue = session.overallScore ?? session.score;

                  // formatted date string below this code block
                  const dateString = session.completedAt
                    ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : (session.dateLabel || 'Recent');

                  return (
                    <tr key={sessionId} className="hover:bg-app-muted/30 transition-colors">

                      {/* target role title and configuration details below this code block */}
                      <td className="p-4 font-semibold text-app-text-primary">
                        {roleName}
                        <div className="text-[11px] text-app-text-muted font-normal mt-0.5">
                          {session.difficulty} • {session.experienceLevel} • {totalCount} Questions
                        </div>
                      </td>

                      {/* category badge below this code block */}
                      <td className="p-4">
                        <span className="badge badge-primary">{session.category}</span>
                      </td>

                      {/* status badge below this code block */}
                      <td className="p-4">
                        {isCompleted ? (
                          <span className="badge badge-strong">Completed</span>
                        ) : isInProgress ? (
                          <span className="badge badge-moderate">In Progress ({answeredCount}/{totalCount})</span>
                        ) : (
                          <span className="badge badge-weak">Evaluation Failed</span>
                        )}
                      </td>

                      {/* authoritative score column below this code block */}
                      <td className="p-4 font-mono font-bold">
                        {isCompleted && scoreValue !== null && scoreValue !== undefined ? (
                          <span className={scoreValue >= 75 ? 'text-status-strong' : scoreValue >= 50 ? 'text-status-moderate' : 'text-status-weak'}>
                            {scoreValue} / 100
                          </span>
                        ) : isFailed ? (
                          <span className="text-amber-500 font-medium">Pending</span>
                        ) : (
                          <span className="text-app-text-muted font-normal">—</span>
                        )}
                      </td>

                      {/* date column below this code block */}
                      <td className="p-4 text-app-text-muted">{dateString}</td>

                      {/* status-based action button column below this code block (HIST-002) */}
                      <td className="p-4 text-right">
                        {isCompleted ? (
                          <Link
                            to={`/interview/${sessionId}/report`}
                            className="btn-outline py-1 px-3 text-xs inline-flex items-center gap-1.5 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </Link>
                        ) : isInProgress ? (
                          <Link
                            to={`/interview/${sessionId}/session`}
                            className="btn-primary py-1 px-3 text-xs inline-flex items-center gap-1.5 font-medium"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Resume ({answeredCount}/{totalCount})</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/interview/${sessionId}/report`}
                            className="btn-outline py-1 px-3 text-xs inline-flex items-center gap-1.5 text-status-weak border-status-weak/30 font-medium"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Evaluation</span>
                          </Link>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* empty state handling for zero sessions or unmatched filters below this code block (HIST-003) */
          <div className="p-12 text-center text-xs text-app-text-muted space-y-3">
            <div className="w-12 h-12 rounded-xl bg-app-accent/10 text-app-accent flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-app-text-primary">
                {isFiltered ? 'No Matching Interview Sessions' : 'No Mock Interviews Found'}
              </p>
              <p className="max-w-sm mx-auto">
                {isFiltered
                  ? 'No interview sessions match your selected search query or filter options.'
                  : "You haven't practiced any mock interviews yet. Launch your first session to build your preparation history."}
              </p>
            </div>
            {isFiltered ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Reset Filters
              </button>
            ) : (
              <Link to="/interview/new" className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-2 shadow-sm font-semibold">
                <PlusCircle className="w-4 h-4" />
                <span>Start Your First Interview</span>
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

// default export below this code block
export default InterviewHistory;
