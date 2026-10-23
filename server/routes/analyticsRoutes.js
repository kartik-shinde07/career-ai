// imports for express router auth middleware and interview mongoose model below this code block
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Interview = require('../models/Interview');

// express router initialization below this code block
const router = express.Router();

// analytics and dashboard aggregation endpoint controller below this code block (Section 17, Section 24, ANALYTICS-001 to ANALYTICS-004, DASH-001 to DASH-004)
router.get('/summary', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // fetch all interview sessions owned by authenticated user below this code block (AUTH-006)
    const allInterviews = await Interview.find({ userId }).sort({ createdAt: -1 });

    // separate completed interviews with valid scores from in-progress or failed sessions below this code block (Section 24 Rules)
    const completedInterviews = allInterviews.filter(
      (item) => item.status === 'completed' && typeof item.overallScore === 'number' && !isNaN(item.overallScore)
    );
    const inProgressInterviews = allInterviews.filter((item) => item.status === 'in_progress');
    const failedInterviews = allInterviews.filter((item) => item.status === 'evaluation_failed');

    const totalInterviews = allInterviews.length;
    const completedCount = completedInterviews.length;
    const inProgressCount = inProgressInterviews.length;

    // calculate overall average score across completed interviews below this code block (ANALYTICS-001)
    const averageScore = completedCount > 0
      ? Number((completedInterviews.reduce((sum, item) => sum + item.overallScore, 0) / completedCount).toFixed(1))
      : null;

    // calculate total questions evaluated across completed interviews below this code block
    const totalQuestionsAnswered = completedInterviews.reduce(
      (sum, item) => sum + (item.questionCount || (Array.isArray(item.questions) ? item.questions.length : 0)),
      0
    );

    // sort completed interviews chronologically descending to calculate latest score delta below this code block
    const sortedCompletedDesc = [...completedInterviews].sort(
      (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    );

    const latestScoreDelta = completedCount >= 2
      ? Number((sortedCompletedDesc[0].overallScore - sortedCompletedDesc[1].overallScore).toFixed(1))
      : null;

    // build kpi metrics summary object below this code block (DASH-001)
    const kpis = {
      totalInterviews,
      completedCount,
      inProgressCount,
      averageScore,
      totalQuestionsAnswered,
      latestScoreDelta
    };

    // build chronological score progression for recharts area/line visualization below this code block (ANALYTICS-002, DASH-002)
    const sortedCompletedAsc = [...completedInterviews].sort(
      (a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt)
    );

    const scoreProgression = sortedCompletedAsc.map((item, index) => {
      const d = new Date(item.completedAt || item.createdAt);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        interviewId: item._id,
        sessionNumber: index + 1,
        dateLabel,
        formattedDate: dateLabel,
        date: dateLabel,
        targetRole: item.targetRole,
        role: item.targetRole,
        category: item.category,
        overallScore: item.overallScore,
        score: item.overallScore
      };
    });

    // compute 4-criterion averages and normalized mastery percentages below this code block (ANALYTICS-001)
    let criterionAverages = null;
    if (completedCount > 0) {
      let sumTech = 0;
      let sumRel = 0;
      let sumClar = 0;
      let sumComp = 0;
      let countTech = 0;
      let countRel = 0;
      let countClar = 0;
      let countComp = 0;

      for (const item of completedInterviews) {
        if (item.criterionAverages) {
          if (typeof item.criterionAverages.technicalAccuracy === 'number') {
            sumTech += item.criterionAverages.technicalAccuracy;
            countTech++;
          }
          if (typeof item.criterionAverages.relevance === 'number') {
            sumRel += item.criterionAverages.relevance;
            countRel++;
          }
          if (typeof item.criterionAverages.clarity === 'number') {
            sumClar += item.criterionAverages.clarity;
            countClar++;
          }
          if (typeof item.criterionAverages.completeness === 'number') {
            sumComp += item.criterionAverages.completeness;
            countComp++;
          }
        }
      }

      const avgTech = countTech > 0 ? sumTech / countTech : 0;
      const avgRel = countRel > 0 ? sumRel / countRel : 0;
      const avgClar = countClar > 0 ? sumClar / countClar : 0;
      const avgComp = countComp > 0 ? sumComp / countComp : 0;

      const rawTech = Number(avgTech.toFixed(1));
      const rawRel = Number(avgRel.toFixed(1));
      const rawClar = Number(avgClar.toFixed(1));
      const rawComp = Number(avgComp.toFixed(1));

      const pctTech = Number(Math.min(100, (avgTech / 40) * 100).toFixed(1));
      const pctRel = Number(Math.min(100, (avgRel / 25) * 100).toFixed(1));
      const pctClar = Number(Math.min(100, (avgClar / 20) * 100).toFixed(1));
      const pctComp = Number(Math.min(100, (avgComp / 15) * 100).toFixed(1));

      const criteriaList = [
        { criterion: 'Technical Accuracy', name: 'Technical Accuracy', score: rawTech, raw: rawTech, maxScore: 40, max: 40, percentage: pctTech, weight: '40%', color: '#6366F1' },
        { criterion: 'Relevance', name: 'Relevance', score: rawRel, raw: rawRel, maxScore: 25, max: 25, percentage: pctRel, weight: '25%', color: '#10B981' },
        { criterion: 'Clarity', name: 'Clarity & Communication', score: rawClar, raw: rawClar, maxScore: 20, max: 20, percentage: pctClar, weight: '20%', color: '#F59E0B' },
        { criterion: 'Completeness', name: 'Completeness', score: rawComp, raw: rawComp, maxScore: 15, max: 15, percentage: pctComp, weight: '15%', color: '#EC4899' }
      ];

      const sortedByPct = [...criteriaList].sort((a, b) => b.percentage - a.percentage);

      criterionAverages = {
        technicalAccuracy: { raw: rawTech, max: 40, percentage: pctTech },
        relevance: { raw: rawRel, max: 25, percentage: pctRel },
        clarity: { raw: rawClar, max: 20, percentage: pctClar },
        completeness: { raw: rawComp, max: 15, percentage: pctComp },
        strongestCriterion: sortedByPct[0].name,
        strongestPercentage: sortedByPct[0].percentage,
        weakestCriterion: sortedByPct[sortedByPct.length - 1].name,
        weakestPercentage: sortedByPct[sortedByPct.length - 1].percentage,
        list: criteriaList
      };
    }

    // calculate category distribution and mean scores below this code block (ANALYTICS-003)
    const VALID_CATEGORIES = ['Technical', 'Behavioral', 'HR', 'Role-based'];
    const categoryBreakdown = VALID_CATEGORIES.map((cat) => {
      const matching = completedInterviews.filter((i) => i.category === cat);
      const count = matching.length;
      const avg = count > 0
        ? Number((matching.reduce((acc, i) => acc + i.overallScore, 0) / count).toFixed(1))
        : null;

      const colorMap = {
        'Technical': '#6366F1',
        'Behavioral': '#10B981',
        'HR': '#F59E0B',
        'Role-based': '#8B5CF6'
      };

      return {
        category: cat,
        completedCount: count,
        sessions: count,
        averageScore: avg,
        avgScore: avg !== null ? avg : 0,
        color: colorMap[cat] || '#6366F1'
      };
    });

    // aggregate recurring study topics case-insensitively across completed interviews below this code block (ANALYTICS-003)
    const topicMap = {};
    for (const item of completedInterviews) {
      if (Array.isArray(item.summaryFeedback?.topicsToPractice)) {
        for (const topic of item.summaryFeedback.topicsToPractice) {
          if (topic && typeof topic === 'string') {
            const trimmed = topic.trim();
            const key = trimmed.toLowerCase();
            if (key) {
              if (!topicMap[key]) {
                topicMap[key] = { topic: trimmed, count: 0, category: item.category };
              }
              topicMap[key].count++;
            }
          }
        }
      }

      if (Array.isArray(item.questions)) {
        for (const q of item.questions) {
          if (Array.isArray(q.evaluation?.topicsToPractice)) {
            for (const topic of q.evaluation.topicsToPractice) {
              if (topic && typeof topic === 'string') {
                const trimmed = topic.trim();
                const key = trimmed.toLowerCase();
                if (key) {
                  if (!topicMap[key]) {
                    topicMap[key] = { topic: trimmed, count: 0, category: item.category };
                  }
                  topicMap[key].count++;
                }
              }
            }
          }
        }
      }
    }

    const topTopicsToPractice = Object.values(topicMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((entry, idx) => ({
        id: `topic_${idx + 1}`,
        topic: entry.topic,
        count: entry.count,
        category: entry.category || 'General',
        frequency: `${entry.count} ${entry.count === 1 ? 'session' : 'sessions'} flagged`,
        recommendation: `Recommended practice area based on ${entry.count} evaluation assessments.`
      }));

    // format top 5 most recent interviews of any status for dashboard below this code block (DASH-003)
    const recentInterviews = allInterviews.slice(0, 5).map((item) => {
      const answeredCount = Array.isArray(item.questions)
        ? item.questions.filter((q) => q.userAnswer && q.userAnswer.trim().length >= 5).length
        : 0;

      const dateObj = new Date(item.completedAt || item.createdAt);
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return {
        _id: item._id,
        id: item._id,
        targetRole: item.targetRole,
        role: item.targetRole,
        category: item.category,
        difficulty: item.difficulty,
        experienceLevel: item.experienceLevel,
        questionCount: item.questionCount,
        currentQuestionIndex: item.currentQuestionIndex,
        status: item.status,
        overallScore: item.overallScore,
        score: item.overallScore,
        answeredCount,
        dateLabel,
        createdAt: item.createdAt,
        completedAt: item.completedAt
      };
    });

    // return consolidated analytics and dashboard payload below this code block
    return res.status(200).json({
      success: true,
      kpis,
      scoreProgression,
      criterionAverages,
      categoryBreakdown,
      topTopicsToPractice,
      recentInterviews
    });
  } catch (error) {
    next(error);
  }
});

// export analytics router below this code block
module.exports = router;
