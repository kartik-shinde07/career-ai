// imports for groq-sdk library below this code block
const Groq = require('groq-sdk');

// helper function to get initialized groq client instance below this code block
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_placeholder_replace_with_real_key') {
    throw new Error('GROQ_API_KEY is not configured in server environment variables.');
  }
  return new Groq({ apiKey });
};

// helper function to sanitize json text by removing markdown code fences below this code block
const sanitizeJsonResponse = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  // remove markdown json code blocks if present below this code block
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

// helper function to detect groq 404 model not found errors below this code block
const isModelNotFoundError = (err) => {
  if (!err) return false;
  const status = err.status || err.statusCode;
  const code = err.code || err.error?.code;
  const msg = (err.message || '').toLowerCase();
  return (
    status === 404 ||
    code === 'model_not_found' ||
    msg.includes('404') ||
    msg.includes('model_not_found') ||
    msg.includes('model not found') ||
    msg.includes('does not exist')
  );
};

// helper function to detect groq 429 rate limit errors below this code block
const isRateLimitError = (err) => {
  if (!err) return false;
  const status = err.status || err.statusCode;
  const code = err.code || err.error?.code;
  const msg = (err.message || '').toLowerCase();
  return (
    status === 429 ||
    code === 'rate_limit_exceeded' ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('quota') ||
    msg.includes('too many requests')
  );
};

// helper function to clamp numeric value between min and max bounds below this code block
const clampScore = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, Math.round(num * 10) / 10));
};

// authoritative backend score calculation and rubric bounds validation below this code block (EVAL-002)
const calculateAuthoritativeScores = (rawEvaluations, questions) => {
  const evaluatedQuestions = [];
  let sumTech = 0;
  let sumRel = 0;
  let sumCla = 0;
  let sumComp = 0;
  let sumTotal = 0;

  for (let i = 0; i < questions.length; i++) {
    const originalQ = questions[i];
    const qNum = originalQ.questionNumber || i + 1;

    // locate matching evaluation item from groq ai response below this code block
    const matchedEval =
      rawEvaluations.find((e) => Number(e.questionNumber) === qNum) ||
      rawEvaluations[i] ||
      {};

    // enforce strict rubric bounds: technical (0-40), relevance (0-25), clarity (0-20), completeness (0-15) below this code block
    const technicalAccuracy = clampScore(matchedEval.technicalAccuracy, 0, 40);
    const relevance = clampScore(matchedEval.relevance, 0, 25);
    const clarity = clampScore(matchedEval.clarity, 0, 20);
    const completeness = clampScore(matchedEval.completeness, 0, 15);

    // authoritative backend question score sum calculation below this code block (EVAL-002)
    const questionScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(technicalAccuracy + relevance + clarity + completeness),
      ),
    );

    // accumulate totals for session-level averages below this code block
    sumTech += technicalAccuracy;
    sumRel += relevance;
    sumCla += clarity;
    sumComp += completeness;
    sumTotal += questionScore;

    // sanitize qualitative feedback strings and arrays below this code block (EVAL-003)
    const feedback =
      typeof matchedEval.feedback === "string" &&
      matchedEval.feedback.trim().length > 0
        ? matchedEval.feedback.trim()
        : "Answer demonstrates functional understanding with opportunities for deeper conceptual clarity.";

    const strengths =
      Array.isArray(matchedEval.strengths) && matchedEval.strengths.length > 0
        ? matchedEval.strengths.map((s) => String(s).trim()).filter(Boolean)
        : ["Clear articulation of key core ideas."];

    const improvements =
      Array.isArray(matchedEval.improvements) &&
      matchedEval.improvements.length > 0
        ? matchedEval.improvements.map((s) => String(s).trim()).filter(Boolean)
        : [
            "Consider incorporating concrete metrics, edge cases, and architectural trade-offs.",
          ];

    const suggestedAnswer =
      typeof matchedEval.suggestedAnswer === "string" &&
      matchedEval.suggestedAnswer.trim().length > 0
        ? matchedEval.suggestedAnswer.trim()
        : `A strong answer directly addresses ${originalQ.topicTag || "the concept"} by defining core principles, outlining practical implementation steps, and discussing production trade-offs.`;

    const topicsToPractice =
      Array.isArray(matchedEval.topicsToPractice) &&
      matchedEval.topicsToPractice.length > 0
        ? matchedEval.topicsToPractice
            .map((s) => String(s).trim())
            .filter(Boolean)
        : [originalQ.topicTag || "System Design"];

    evaluatedQuestions.push({
      questionNumber: qNum,
      evaluation: {
        technicalAccuracy,
        relevance,
        clarity,
        completeness,
        questionScore,
        feedback,
        strengths,
        improvements,
        suggestedAnswer,
        topicsToPractice,
      },
    });
  }

  const N = questions.length || 1;

  // calculate authoritative session criterion averages and overall score rounded to 1 decimal place below this code block
  const criterionAverages = {
    technicalAccuracy: Math.round((sumTech / N) * 10) / 10,
    relevance: Math.round((sumRel / N) * 10) / 10,
    clarity: Math.round((sumCla / N) * 10) / 10,
    completeness: Math.round((sumComp / N) * 10) / 10,
  };

  const overallScore = Math.round((sumTotal / N) * 10) / 10;

  return {
    evaluatedQuestions,
    criterionAverages,
    overallScore,
  };
};

// deterministic fallback scoring calculation adhering strictly to the 100-point rubric below this code block
const calculateFallbackScoring = (interview) => {
  const { questions = [], category = 'Technical', targetRole = 'Software Engineer' } = interview;
  const isHRorBehavioral = category === 'HR' || category === 'Behavioral';

  // relevant technical and behavioral keywords for contextual depth analysis below this code block
  const technicalKeywords = [
    'architecture', 'scale', 'scaling', 'performance', 'database', 'sql', 'nosql',
    'query', 'index', 'indexing', 'api', 'rest', 'graphql', 'latency', 'cache',
    'caching', 'redis', 'security', 'auth', 'jwt', 'token', 'async', 'promise',
    'concurrency', 'state', 'component', 'lifecycle', 'hook', 'dom', 'rendering',
    'docker', 'container', 'ci/cd', 'test', 'testing', 'mock', 'service', 'microservice',
    'trade-off', 'tradeoff', 'error', 'boundary', 'resilience', 'failover', 'optimization'
  ];

  const behavioralKeywords = [
    'situation', 'task', 'action', 'result', 'star', 'team', 'collaboration',
    'conflict', 'priority', 'prioritize', 'deadline', 'impact', 'stakeholder',
    'communication', 'leadership', 'ownership', 'mentor', 'feedback', 'learning',
    'retrospective', 'deliver', 'trade-off', 'resolution', 'growth', 'initiative'
  ];

  const targetKeywords = isHRorBehavioral ? behavioralKeywords : technicalKeywords;

  let sumTech = 0;
  let sumRel = 0;
  let sumCla = 0;
  let sumComp = 0;
  let sumTotal = 0;

  const evaluatedQuestions = questions.map((q, idx) => {
    const qNum = q.questionNumber || idx + 1;
    const answer = (q.userAnswer || '').trim();
    const lowerAnswer = answer.toLowerCase();

    // calculate answer length metrics below this code block
    const wordCount = answer ? answer.split(/\s+/).length : 0;
    const charCount = answer.length;

    // calculate keyword matches within answer text below this code block
    const matchedKeywords = targetKeywords.filter((kw) => lowerAnswer.includes(kw));
    const keywordCount = matchedKeywords.length;

    // 1. Technical Accuracy (max 40) based on answer length and technical terminology
    let technicalAccuracy = 20;
    if (wordCount >= 80 && keywordCount >= 4) {
      technicalAccuracy = Math.min(39, 33 + Math.min(6, keywordCount * 2));
    } else if (wordCount >= 50 && keywordCount >= 2) {
      technicalAccuracy = Math.min(34, 27 + keywordCount * 2);
    } else if (wordCount >= 25) {
      technicalAccuracy = Math.min(27, 21 + keywordCount * 2);
    } else if (wordCount >= 10) {
      technicalAccuracy = 18;
    } else {
      technicalAccuracy = Math.max(10, Math.min(16, wordCount * 2));
    }

    // 2. Relevance & Context (max 25) based on prompt topic alignment
    let relevance = 15;
    const topicTerms = (q.topicTag || q.targetCompetency || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3);
    const topicMatches = topicTerms.filter((term) => lowerAnswer.includes(term)).length;

    if (wordCount >= 50 && (topicMatches > 0 || keywordCount >= 2)) {
      relevance = Math.min(24, 20 + topicMatches * 2);
    } else if (wordCount >= 25) {
      relevance = Math.min(20, 16 + topicMatches * 2);
    } else {
      relevance = Math.max(8, Math.min(15, 10 + topicMatches * 2));
    }

    // 3. Clarity & Communication (max 20) based on structure, sentence count, and readability
    let clarity = 12;
    const sentenceCount = (answer.match(/[.!?]+/g) || []).length;
    if (sentenceCount >= 3 && wordCount >= 40) {
      clarity = Math.min(19, 16 + Math.min(3, sentenceCount));
    } else if (sentenceCount >= 2 && wordCount >= 20) {
      clarity = 15;
    } else if (wordCount >= 10) {
      clarity = 13;
    } else {
      clarity = Math.max(6, Math.min(12, sentenceCount * 3 + 4));
    }

    // 4. Completeness (max 15) based on thoroughness and concrete examples
    let completeness = 9;
    const mentionsExample = /for example|for instance|specifically|such as|in my project|we used|i implemented/i.test(answer);
    if (wordCount >= 70 && mentionsExample) {
      completeness = 14;
    } else if (wordCount >= 50) {
      completeness = mentionsExample ? 13 : 11;
    } else if (wordCount >= 25) {
      completeness = mentionsExample ? 10 : 8;
    } else {
      completeness = Math.max(4, Math.min(8, Math.floor(wordCount / 3)));
    }

    // compute total question score clamped between 0 and 100 below this code block
    const questionScore = Math.min(
      100,
      Math.max(0, Math.round(technicalAccuracy + relevance + clarity + completeness))
    );

    sumTech += technicalAccuracy;
    sumRel += relevance;
    sumCla += clarity;
    sumComp += completeness;
    sumTotal += questionScore;

    // generate constructive feedback strings below this code block
    const feedback = wordCount >= 40
      ? `Good conceptual coverage with clear articulation of ${q.topicTag || 'key principles'}. Demonstrates solid understanding with clear technical structure.`
      : `Response captures core fundamentals of ${q.topicTag || 'the topic'} but would benefit from further elaboration, edge cases, and concrete production trade-offs.`;

    const strengths = [
      `Directly addressed the core prompt for ${q.topicTag || q.targetCompetency || 'the topic'}.`,
      wordCount >= 35 ? 'Effective explanation of practical implementation details.' : 'Clear and concise delivery of key concepts.'
    ];

    const improvements = [
      'Incorporate concrete production metrics, architectural trade-offs, and failure recovery scenarios.',
      isHRorBehavioral ? 'Structure situational examples using the STAR (Situation, Task, Action, Result) method.' : 'Discuss edge cases and performance impacts at higher scale.'
    ];

    const suggestedAnswer = `A comprehensive answer directly addresses ${q.topicTag || 'the concept'} by defining core architectural principles, detailing step-by-step implementation, and evaluating production trade-offs regarding scalability, latency, and reliability.`;

    const topicsToPractice = [q.topicTag || q.targetCompetency || `${targetRole} Core Architecture`];

    return {
      questionNumber: qNum,
      evaluation: {
        technicalAccuracy,
        relevance,
        clarity,
        completeness,
        questionScore,
        feedback,
        strengths,
        improvements,
        suggestedAnswer,
        topicsToPractice
      }
    };
  });

  const N = questions.length || 1;

  // calculate session criterion averages and overall score below this code block
  const criterionAverages = {
    technicalAccuracy: Math.round((sumTech / N) * 10) / 10,
    relevance: Math.round((sumRel / N) * 10) / 10,
    clarity: Math.round((sumCla / N) * 10) / 10,
    completeness: Math.round((sumComp / N) * 10) / 10
  };

  const overallScore = Math.round((sumTotal / N) * 10) / 10;

  const summaryFeedback = {
    overallSummary: `Successfully completed ${category} interview session for ${targetRole} with an authoritative overall score of ${overallScore}/100 across ${questions.length} questions.`,
    keyStrengths: [
      'Consistent effort in articulating structured responses.',
      'Demonstrated foundational competency aligned with target role expectations.'
    ],
    keyWeaknesses: [
      'Deepen coverage of edge cases, quantifiable metrics, and architectural trade-offs.',
      'Provide more extensive real-world examples to support theoretical points.'
    ],
    topicsToPractice: [
      category,
      targetRole,
      'System Architecture & Trade-off Analysis'
    ]
  };

  return {
    evaluatedQuestions,
    criterionAverages,
    overallScore,
    summaryFeedback
  };
};

// helper function to validate and deduplicate questions array below this code block (AI-002, INT-003)
const validateAndFormatQuestions = (
  questions,
  expectedCount,
  category = 'Technical',
  difficulty = 'Intermediate',
  targetRole = 'Software Engineer'
) => {
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'AI output "questions" must be an array.' };
  }

  const cleanedQuestions = [];
  const seenTexts = new Set();
  const validQuestionTypes = ['conceptual', 'scenario', 'coding', 'behavioral'];

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    if (!item || typeof item.questionText !== 'string') {
      continue;
    }

    const questionText = item.questionText.trim();

    // ensure question text is meaningful and meets minimum length constraint (min 15 chars) below this code block
    if (questionText.length < 15) {
      continue;
    }

    // case-insensitive duplicate check below this code block
    const normalizedText = questionText.toLowerCase();
    if (seenTexts.has(normalizedText)) {
      continue;
    }
    seenTexts.add(normalizedText);

    // format question id e.g. q1, q2 below this code block
    const questionId = item.questionId && typeof item.questionId === 'string'
      ? item.questionId.trim()
      : `q${cleanedQuestions.length + 1}`;

    // validate question type against allowed types below this code block
    const rawType = (item.questionType || '').toLowerCase();
    const questionType = validQuestionTypes.includes(rawType)
      ? rawType
      : (category && validQuestionTypes.includes(category.toLowerCase()) ? category.toLowerCase() : 'conceptual');

    // extract target competency string below this code block
    const targetCompetency = item.targetCompetency && typeof item.targetCompetency === 'string'
      ? item.targetCompetency.trim()
      : (item.topicTag || `${targetRole} Core Competency`);

    // extract difficulty level string below this code block
    const difficultyLevel = item.difficultyLevel && typeof item.difficultyLevel === 'string'
      ? item.difficultyLevel.trim()
      : difficulty;

    // construct fully formatted question object with all required properties below this code block
    cleanedQuestions.push({
      questionId,
      questionNumber: cleanedQuestions.length + 1,
      questionText,
      questionType,
      targetCompetency,
      difficultyLevel,
      topicTag: item.topicTag && typeof item.topicTag === 'string' ? item.topicTag.trim() : targetCompetency,
      userAnswer: '',
      answeredAt: null,
      evaluation: null
    });

    if (cleanedQuestions.length === expectedCount) {
      break;
    }
  }

  // verify exact required question count was met below this code block (INT-003)
  if (cleanedQuestions.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} unique questions, but received ${cleanedQuestions.length}.`
    };
  }

  return { valid: true, questions: cleanedQuestions };
};

// helper function to generate dynamic pre-structured relevant interview questions when groq api fails below this code block
const generateFallbackQuestions = ({
  targetRole = 'Software Engineer',
  experienceLevel = 'Entry-level',
  category = 'Technical',
  difficulty = 'Intermediate',
  count = 5
}) => {
  const normalizedRole = (targetRole || '').toLowerCase();
  const normalizedCategory = (category || 'Technical').toLowerCase();
  const normalizedLevel = (experienceLevel || 'Entry-level').toLowerCase();
  const effectiveDifficulty = difficulty || 'Intermediate';
  const requestedCount = parseInt(count, 10) || 5;

  // determine primary tech domain from target role below this code block
  let domain = 'general';
  if (/frontend|react|vue|angular|ui|web developer|client/i.test(normalizedRole)) {
    domain = 'frontend';
  } else if (/backend|node|express|java|spring|python|django|fastapi|golang|api|database|sql/i.test(normalizedRole)) {
    domain = 'backend';
  } else if (/full\s*stack|mern|mean|software engineer|software developer/i.test(normalizedRole)) {
    domain = 'fullstack';
  } else if (/devops|cloud|sre|infrastructure|kubernetes|docker|aws|azure/i.test(normalizedRole)) {
    domain = 'devops';
  } else if (/data|machine learning|ai|ml|deep learning|analyst/i.test(normalizedRole)) {
    domain = 'data';
  } else if (/mobile|android|ios|flutter|react native/i.test(normalizedRole)) {
    domain = 'mobile';
  }

  // question banks organized by domain and category below this code block
  let baseQuestions = [];

  if (normalizedCategory === 'behavioral' || normalizedCategory === 'hr') {
    baseQuestions = [
      {
        questionText: `Describe a challenging project where you collaborated with cross-functional team members for ${targetRole}. What was your specific role and how did you resolve differing priorities?`,
        questionType: 'behavioral',
        targetCompetency: 'Cross-Functional Collaboration & Communication',
        topicTag: 'Teamwork & Alignment'
      },
      {
        questionText: `Tell me about a situation where project requirements changed drastically mid-sprint before a critical release. How did you assess trade-offs and adapt your delivery?`,
        questionType: 'scenario',
        targetCompetency: 'Adaptability & Agile Prioritization',
        topicTag: 'Sprint Agility'
      },
      {
        questionText: `Can you share an experience where you had a strong disagreement with a colleague or lead regarding a technical decision? How did you present your case and reach alignment?`,
        questionType: 'behavioral',
        targetCompetency: 'Constructive Conflict Resolution',
        topicTag: 'Conflict Management'
      },
      {
        questionText: `Describe a time when a feature you shipped or worked on caused an unexpected issue in production. How did you take ownership, communicate with stakeholders, and prevent recurrence?`,
        questionType: 'scenario',
        targetCompetency: 'Accountability & Incident Remediation',
        topicTag: 'Ownership & Post-Mortem'
      },
      {
        questionText: `How do you prioritize continuous professional learning and staying updated with emerging trends and best practices relevant to a ${targetRole}?`,
        questionType: 'behavioral',
        targetCompetency: 'Continuous Learning & Self-Improvement',
        topicTag: 'Career Growth'
      },
      {
        questionText: `Tell me about a time when you had to manage competing deadlines from multiple stakeholders. How did you organize your workload to maintain high quality?`,
        questionType: 'scenario',
        targetCompetency: 'Time Management & Prioritization',
        topicTag: 'Workload Prioritization'
      },
      {
        questionText: `Describe an occasion where you noticed an inefficiency in your team's workflow or code review process. What initiative did you take to improve it?`,
        questionType: 'behavioral',
        targetCompetency: 'Process Improvement & Initiative',
        topicTag: 'Workflow Optimization'
      },
      {
        questionText: `How do you handle ambiguous requirements when assigned a complex feature with minimal documentation or guidance?`,
        questionType: 'scenario',
        targetCompetency: 'Ambiguity Resolution & Problem Definition',
        topicTag: 'Problem Definition'
      },
      {
        questionText: `Tell me about a time you gave constructive feedback to a peer, or received critical feedback yourself. How did you handle the conversation?`,
        questionType: 'behavioral',
        targetCompetency: 'Feedback Receptivity & Communication',
        topicTag: 'Feedback Exchange'
      },
      {
        questionText: `Describe an accomplishment in your career or academic projects that you are most proud of. What obstacles did you overcome to achieve it?`,
        questionType: 'behavioral',
        targetCompetency: 'Goal Achievement & Resilience',
        topicTag: 'Achievement & Resilience'
      },
      {
        questionText: `How do you approach working with teammates from diverse technical backgrounds and differing communication styles?`,
        questionType: 'scenario',
        targetCompetency: 'Inclusive Teamwork & Empathy',
        topicTag: 'Inclusive Teamwork'
      },
      {
        questionText: `Walk me through a situation where you had to quickly ramp up on a completely unfamiliar technology stack or framework to deliver a feature.`,
        questionType: 'behavioral',
        targetCompetency: 'Fast Learning & Adaptability',
        topicTag: 'Rapid Learning'
      },
      {
        questionText: `Tell me about a time a project was at risk of missing a major milestone. What proactive steps did you take to mitigate the delay?`,
        questionType: 'scenario',
        targetCompetency: 'Risk Management & Delivery Ownership',
        topicTag: 'Milestone Delivery'
      },
      {
        questionText: `Describe a situation where you balanced technical perfection against the pragmatic necessity to ship a Minimum Viable Product (MVP).`,
        questionType: 'scenario',
        targetCompetency: 'Pragmatic Engineering & Business Value',
        topicTag: 'Business Alignment'
      },
      {
        questionText: `Where do you see your engineering career evolving over the next 2 to 3 years, and what skills are you actively developing to achieve that?`,
        questionType: 'behavioral',
        targetCompetency: 'Career Vision & Strategic Planning',
        topicTag: 'Career Vision'
      }
    ];
  } else if (domain === 'frontend') {
    baseQuestions = [
      {
        questionText: 'Explain the Virtual DOM and reconciliation in modern frontend libraries. How does it optimize rendering performance compared to direct browser DOM manipulation?',
        questionType: 'conceptual',
        targetCompetency: 'Virtual DOM & Rendering Pipeline',
        topicTag: 'DOM & Rendering'
      },
      {
        questionText: 'A user search-as-you-type autocomplete triggers sluggish UI re-renders and excessive network requests. How would you diagnose and resolve this performance bottleneck?',
        questionType: 'scenario',
        targetCompetency: 'Frontend Performance & Event Debouncing',
        topicTag: 'Performance Tuning'
      },
      {
        questionText: 'How would you implement a custom debounced input hook or handler in React that cleanly manages loading, data, and error states?',
        questionType: 'coding',
        targetCompetency: 'Component Lifecycle & Custom Hooks',
        topicTag: 'React Hooks'
      },
      {
        questionText: 'A web application crashes with a blank screen when an API returns unexpected null values. How do you implement defensive error boundaries and fallback UI in a component tree?',
        questionType: 'scenario',
        targetCompetency: 'Defensive UI & Error Boundaries',
        topicTag: 'Error Handling'
      },
      {
        questionText: 'Compare component-level state with global state management (Context API, Redux Toolkit, Zustand). When is global state justified versus localized state in a web application?',
        questionType: 'conceptual',
        targetCompetency: 'State Architecture & Data Flow',
        topicTag: 'State Management'
      },
      {
        questionText: 'Your frontend initial JavaScript bundle has grown to 8MB, resulting in poor Core Web Vitals on mobile networks. What specific bundle analysis and code-splitting steps would you take?',
        questionType: 'scenario',
        targetCompetency: 'Bundle Optimization & Code Splitting',
        topicTag: 'Core Web Vitals'
      },
      {
        questionText: 'Describe how to build an accessible, keyboard-navigable modal dialog or virtualized list from scratch without relying on heavy third-party UI libraries.',
        questionType: 'coding',
        targetCompetency: 'Accessibility & Component Construction',
        topicTag: 'WAI-ARIA Accessibility'
      },
      {
        questionText: 'How do you structure CSS for maintainability and scalability across a growing team? Discuss trade-offs between CSS Modules, Tailwind CSS, and CSS-in-JS.',
        questionType: 'scenario',
        targetCompetency: 'CSS Architecture & Styling Maintainability',
        topicTag: 'Styling Architecture'
      },
      {
        questionText: 'Explain how Web Vitals (LCP, FID/INP, CLS) are measured, and what specific architectural techniques you use to improve each metric.',
        questionType: 'conceptual',
        targetCompetency: 'Web Vitals & Performance Engineering',
        topicTag: 'Web Vitals'
      },
      {
        questionText: 'How would you architect an offline-first data caching and optimistic update synchronization engine utilizing Service Workers and IndexedDB?',
        questionType: 'coding',
        targetCompetency: 'Offline Storage & Optimistic UI',
        topicTag: 'Service Workers'
      },
      {
        questionText: 'Compare client-side rendering (CSR), server-side rendering (SSR), and static site generation (SSG). How do they impact initial load speed, SEO, and server cost?',
        questionType: 'conceptual',
        targetCompetency: 'Rendering Architecture & Hydration',
        topicTag: 'SSR vs CSR'
      },
      {
        questionText: 'Describe how you prevent Cross-Site Scripting (XSS) and Content Security Policy (CSP) violations in modern frontend single-page applications.',
        questionType: 'scenario',
        targetCompetency: 'Client-Side Security & XSS Prevention',
        topicTag: 'Frontend Security'
      },
      {
        questionText: 'A high-frequency dashboard leaks memory and freezes the browser main thread during WebSocket burst traffic. Walk through your profiling and remediation process.',
        questionType: 'scenario',
        targetCompetency: 'Runtime Memory Profiling & WebSockets',
        topicTag: 'Memory Profiling'
      },
      {
        questionText: 'How do you structure unit and integration tests for frontend components using tools like Jest, React Testing Library, or Vitest to test behavior over implementation?',
        questionType: 'coding',
        targetCompetency: 'Frontend Testing & TDD',
        topicTag: 'Frontend Testing'
      },
      {
        questionText: 'Tell me about a time you had to push back against a tight product deadline to remediate critical frontend technical debt. How did you justify the business value to leadership?',
        questionType: 'behavioral',
        targetCompetency: 'Technical Leadership & Stakeholder Management',
        topicTag: 'Engineering Leadership'
      }
    ];
  } else if (domain === 'backend') {
    baseQuestions = [
      {
        questionText: 'Explain the core architectural differences between relational (SQL) and document (NoSQL) databases, and when you would select MongoDB over PostgreSQL for a backend service.',
        questionType: 'conceptual',
        targetCompetency: 'Database Modeling & Storage Paradigms',
        topicTag: 'SQL vs NoSQL'
      },
      {
        questionText: 'A REST API endpoint takes over 5 seconds to query user records. What diagnostic steps would you take in your database indexes and server logs to locate the bottleneck?',
        questionType: 'scenario',
        targetCompetency: 'Query Optimization & Indexing',
        topicTag: 'Database Profiling'
      },
      {
        questionText: 'Describe how you implement secure token-based authentication using JWTs, bcrypt password hashing, and authorization middleware in an Express.js server.',
        questionType: 'coding',
        targetCompetency: 'Authentication & Endpoint Security',
        topicTag: 'JWT Authentication'
      },
      {
        questionText: 'Explain the difference between synchronous blocking operations and asynchronous non-blocking event loops. How does this architecture handle high concurrency?',
        questionType: 'scenario',
        targetCompetency: 'Event Loop & Concurrency Mechanics',
        topicTag: 'Event-Driven Architecture'
      },
      {
        questionText: 'Compare RESTful API design with GraphQL and gRPC. What are the key trade-offs regarding network payload size, caching support, and schema evolution?',
        questionType: 'conceptual',
        targetCompetency: 'API Architecture & Protocols',
        topicTag: 'API Protocols'
      },
      {
        questionText: 'Your backend service experiences database connection pool exhaustion during peak hours. How do you configure pool sizes, timeouts, and connection lifecycles to maintain uptime?',
        questionType: 'scenario',
        targetCompetency: 'Connection Pool Management & Resilience',
        topicTag: 'Connection Pooling'
      },
      {
        questionText: 'How do you design an idempotent API endpoint for payment processing or order checkout to safely handle network retries without duplicate charges?',
        questionType: 'coding',
        targetCompetency: 'API Idempotency & Transaction Safety',
        topicTag: 'Idempotency'
      },
      {
        questionText: 'Describe your defensive strategy for securing backend APIs against common vulnerabilities like SQL/NoSQL injection, Broken Object Level Authorization (BOLA), and CSRF.',
        questionType: 'scenario',
        targetCompetency: 'Application Security & Threat Prevention',
        topicTag: 'API Security'
      },
      {
        questionText: 'How do you apply the CAP theorem, eventual consistency models, and distributed consensus mechanisms when designing a distributed backend for a mission-critical service?',
        questionType: 'conceptual',
        targetCompetency: 'Distributed Systems & CAP Theorem',
        topicTag: 'Distributed Systems'
      },
      {
        questionText: 'How would you implement a distributed sliding-window rate limiter across clustered API server nodes using Redis and Lua script atomicity?',
        questionType: 'coding',
        targetCompetency: 'Distributed Caching & Algorithm Design',
        topicTag: 'Rate Limiting'
      },
      {
        questionText: 'Walk through a zero-downtime database schema migration strategy for a table with 50 million records without locking writes or degrading API read performance.',
        questionType: 'scenario',
        targetCompetency: 'Zero-Downtime Database Migrations',
        topicTag: 'Database Migrations'
      },
      {
        questionText: 'You need to scale a core write-heavy service from 2,000 writes/sec to 100,000 writes/sec with sub-50ms latency. Describe your database sharding, caching, and message broker strategy.',
        questionType: 'scenario',
        targetCompetency: 'High-Throughput Architecture & Sharding',
        topicTag: 'System Scaling'
      },
      {
        questionText: 'Explain the principles of Domain-Driven Design (DDD) and how you establish bounded contexts and repository patterns in a complex domain.',
        questionType: 'conceptual',
        targetCompetency: 'Domain-Driven Design & Software Patterns',
        topicTag: 'Domain Modeling'
      },
      {
        questionText: 'How do you implement structured logging, distributed tracing (OpenTelemetry), and health metrics to maintain observability across microservices?',
        questionType: 'coding',
        targetCompetency: 'Observability & Distributed Tracing',
        topicTag: 'Observability'
      },
      {
        questionText: 'Walk me through a challenging backend bug or unexpected server crash you resolved in a recent project. What was your systematic troubleshooting methodology?',
        questionType: 'behavioral',
        targetCompetency: 'Debugging Methodology & Root Cause Analysis',
        topicTag: 'Troubleshooting'
      }
    ];
  } else if (domain === 'fullstack') {
    baseQuestions = [
      {
        questionText: 'Trace the complete lifecycle of a web request from a user clicking a button in the browser to server routing, database queries, and response re-rendering.',
        questionType: 'conceptual',
        targetCompetency: 'Full-Stack Architecture & Request Lifecycle',
        topicTag: 'Request Lifecycle'
      },
      {
        questionText: 'Users report intermittent session loss when navigating between frontend views. How would you investigate cookie flags, localStorage security, and token expiration?',
        questionType: 'scenario',
        targetCompetency: 'Session Persistence & Token Lifecycle',
        topicTag: 'Session Management'
      },
      {
        questionText: 'How do you coordinate validation logic between frontend forms and backend controllers, and why must backend validation remain strictly authoritative?',
        questionType: 'coding',
        targetCompetency: 'Authoritative Validation & Data Sanitization',
        topicTag: 'Data Validation'
      },
      {
        questionText: 'Explain Cross-Origin Resource Sharing (CORS). Why do browsers enforce CORS restrictions, and how do you properly configure CORS headers on the server?',
        questionType: 'scenario',
        targetCompetency: 'CORS Protocol & Web Security',
        topicTag: 'CORS Configuration'
      },
      {
        questionText: 'Compare Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG). When should each approach be selected based on performance and SEO needs?',
        questionType: 'conceptual',
        targetCompetency: 'Rendering Paradigms & Web Performance',
        topicTag: 'Rendering Strategies'
      },
      {
        questionText: 'Your full-stack application experiences performance degradation under moderate concurrency. How do you systematically profile both frontend rendering and backend event loop delays?',
        questionType: 'scenario',
        targetCompetency: 'Full-Stack Performance Diagnostics',
        topicTag: 'Performance Diagnostics'
      },
      {
        questionText: 'How would you architect a secure direct-to-cloud file upload pipeline utilizing presigned URLs to prevent server memory bloat and protect storage credentials?',
        questionType: 'coding',
        targetCompetency: 'Cloud Storage Integration & Presigned URLs',
        topicTag: 'File Upload Pipeline'
      },
      {
        questionText: 'How do you guarantee ACID transaction integrity when creating a record involves multiple dependent database updates across related collections or tables?',
        questionType: 'scenario',
        targetCompetency: 'Database Transactions & Consistency',
        topicTag: 'Database Transactions'
      },
      {
        questionText: 'How do you determine the boundary between a modular monolith and microservices when designing an extensible application architecture for a growing team?',
        questionType: 'conceptual',
        targetCompetency: 'System Decomposition & Modular Architecture',
        topicTag: 'Architecture Strategy'
      },
      {
        questionText: 'A critical third-party API begins failing with high latency, causing cascading thread exhaustion in your application. How do you implement circuit breakers and fallback queues?',
        questionType: 'scenario',
        targetCompetency: 'Fault Tolerance & Circuit Breaking',
        topicTag: 'Resilience Patterns'
      },
      {
        questionText: 'Architect a real-time collaborative workspace supporting concurrent user edits, conflict resolution, and reliable WebSocket state synchronization.',
        questionType: 'coding',
        targetCompetency: 'Real-Time Synchronization & Concurrency',
        topicTag: 'WebSockets & Concurrency'
      },
      {
        questionText: 'Design a production CI/CD deployment pipeline incorporating automated unit and end-to-end tests, container staging, and zero-downtime blue-green deployments.',
        questionType: 'scenario',
        targetCompetency: 'Continuous Delivery & Zero-Downtime Deployment',
        topicTag: 'CI/CD Pipelines'
      },
      {
        questionText: 'Explain how you approach database schema versioning and data migrations across multiple running environments in a fast-paced development cycle.',
        questionType: 'conceptual',
        targetCompetency: 'Database Versioning & Migration Safety',
        topicTag: 'Data Versioning'
      },
      {
        questionText: 'How do you secure web applications against OWASP Top 10 vulnerabilities including Injection, Broken Authentication, and Sensitive Data Exposure?',
        questionType: 'scenario',
        targetCompetency: 'OWASP Security & Threat Mitigation',
        topicTag: 'Web Security'
      },
      {
        questionText: 'Tell me about your most comprehensive full-stack application. What architectural choices were you proud of, and what would you refactor if building it today?',
        questionType: 'behavioral',
        targetCompetency: 'Project Architecture & Critical Reflection',
        topicTag: 'Project Experience'
      }
    ];
  } else {
    // general and custom role track below this code block
    baseQuestions = [
      {
        questionText: `What are the core foundational principles, architectural patterns, and industry best practices that define technical excellence for a ${targetRole}?`,
        questionType: 'conceptual',
        targetCompetency: `${targetRole} Core Competencies`,
        topicTag: 'Core Principles'
      },
      {
        questionText: `You encounter an unexpected high-priority production issue impacting users in your role as ${targetRole}. How do you structure your investigation, triage, and root cause analysis?`,
        questionType: 'scenario',
        targetCompetency: 'Problem Solving & Production Triage',
        topicTag: 'Production Triage'
      },
      {
        questionText: `Describe how you design, implement, and test a modular, resilient feature or service to solve a complex functional requirement for a ${targetRole}.`,
        questionType: 'coding',
        targetCompetency: 'Technical Design & Implementation',
        topicTag: 'Technical Implementation'
      },
      {
        questionText: `How do you assess and balance trade-offs between delivery speed, performance, scalability, and code maintainability when planning technical tasks?`,
        questionType: 'scenario',
        targetCompetency: 'Trade-off Evaluation & Architecture',
        topicTag: 'Architecture Trade-offs'
      },
      {
        questionText: `Tell me about a high-impact technical initiative or academic project you completed for ${targetRole}. What were the key challenges and how did you overcome them?`,
        questionType: 'behavioral',
        targetCompetency: 'Project Delivery & Technical Accountability',
        topicTag: 'Project Delivery'
      },
      {
        questionText: `Explain how you approach testing and quality assurance across unit, integration, and end-to-end levels when developing solutions as a ${targetRole}.`,
        questionType: 'conceptual',
        targetCompetency: 'Testing Strategy & Quality Assurance',
        topicTag: 'Quality Assurance'
      },
      {
        questionText: `A feature you implemented functions properly in local testing but exhibits significant latency under load in production. How do you isolate the bottleneck?`,
        questionType: 'scenario',
        targetCompetency: 'Performance Diagnostics & Profiling',
        topicTag: 'Performance Tuning'
      },
      {
        questionText: `Walk through how you implement secure data handling, access controls, and validation to prevent unauthorized access or data corruption in your role.`,
        questionType: 'coding',
        targetCompetency: 'Security & Defensive Programming',
        topicTag: 'Defensive Design'
      },
      {
        questionText: `How do you approach continuous integration, automated deployments, and configuration management for software you build as a ${targetRole}?`,
        questionType: 'scenario',
        targetCompetency: 'DevOps & Deployment Automation',
        topicTag: 'Deployment Workflow'
      },
      {
        questionText: `Describe a situation where you had to evaluate two competing libraries, frameworks, or technologies for a project. What criteria guided your final decision?`,
        questionType: 'conceptual',
        targetCompetency: 'Technology Evaluation & Decision Making',
        topicTag: 'Technology Selection'
      },
      {
        questionText: `How do you design APIs or interfaces to ensure backward compatibility and minimal disruption for downstream clients during updates?`,
        questionType: 'scenario',
        targetCompetency: 'Interface Design & Backward Compatibility',
        topicTag: 'API Compatibility'
      },
      {
        questionText: `Describe how you implement resilient error handling, retry policies, and fallback states when integrating with external third-party services.`,
        questionType: 'coding',
        targetCompetency: 'Resilience Patterns & Error Recovery',
        topicTag: 'Error Recovery'
      },
      {
        questionText: `What metrics, logs, and monitoring dashboards do you rely on to ensure the health and reliability of systems in your domain?`,
        questionType: 'conceptual',
        targetCompetency: 'System Observability & Monitoring',
        topicTag: 'System Observability'
      },
      {
        questionText: `Tell me about a time you identified technical debt that was slowing down development. How did you plan and execute the refactoring effort?`,
        questionType: 'scenario',
        targetCompetency: 'Refactoring & Technical Debt Management',
        topicTag: 'Technical Debt'
      },
      {
        questionText: `How do you collaborate with product managers, QA engineers, and designers to translate high-level business goals into precise technical requirements?`,
        questionType: 'behavioral',
        targetCompetency: 'Cross-Functional Requirements Translation',
        topicTag: 'Requirements Translation'
      }
    ];
  }

  // slice to exactly requested count below this code block
  const selectedQuestions = baseQuestions.slice(0, requestedCount);

  // attach default user answer and evaluation fields to every fallback question below this code block
  return selectedQuestions.map((item, idx) => ({
    questionId: `q${idx + 1}`,
    questionNumber: idx + 1,
    questionText: item.questionText,
    questionType: item.questionType || 'conceptual',
    targetCompetency: item.targetCompetency || `${targetRole} Core Skills`,
    difficultyLevel: effectiveDifficulty,
    topicTag: item.topicTag || 'General',
    userAnswer: '',
    answeredAt: null,
    evaluation: null
  }));
};

// interview question generation service invoking groq api dynamically requesting count questions below this code block
const generateInterviewQuestions = async ({
  targetRole,
  experienceLevel,
  category,
  difficulty,
  questionCount,
  count: explicitCount
}) => {
  // resolve dynamic count from explicitCount or questionCount defaulting to 5 below this code block
  const count = parseInt(explicitCount || questionCount, 10) || 5;

  // resolve target groq model with llama-3.1-8b-instant default fallback below this code block
  let model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  if (model === 'llama-3.3-70b-versatile') {
    model = 'llama-3.1-8b-instant';
  }

  // attempt initialization of groq client below this code block
  let groq;
  try {
    groq = getGroqClient();
  } catch (clientErr) {
    // log groq client initialization warning below this code block
    console.warn('[Groq AI Service] Groq client initialization warning:', clientErr.message);

    // generate pre-structured fallback questions on missing or invalid api key below this code block
    return generateFallbackQuestions({
      targetRole,
      experienceLevel,
      category,
      difficulty,
      count
    });
  }

  // detailed system instructions for groq interviewer dynamically requesting count questions below this code block
  const systemPrompt = `You are a Principal Software Architect and Executive Interviewer.
Your task is to generate realistic, professional, and role-appropriate interview questions for a mock interview session.

CONFIGURATION PARAMETERS:
- Target Job Role: ${targetRole}
- Candidate Experience Level: ${experienceLevel}
- Interview Category Track: ${category}
- Difficulty Tier: ${difficulty}
- Total Questions Required: ${count}

CATEGORY GUIDELINES:
- "Technical": Core concepts, algorithms, APIs, systems, frameworks, debugging, and real-world implementation details relevant to ${targetRole}.
- "Behavioral": STAR-method scenarios covering workplace conflict, leadership, deadline pressure, teamwork, and accountability.
- "HR": Career motivations, cultural adaptability, long-term goals, salary expectations, ethics, and company fit.
- "Role-based": Day-to-day practical scenarios, situational architecture decisions, and task execution for a ${targetRole}.

DIFFICULTY & LEVEL CALIBRATION:
- "Fresher" + "Beginner": Focus on fundamentals, mental models, and project applications.
- "Experienced" + "Advanced": Focus on scale, trade-offs, edge cases, distributed failure recovery, and architectural decisions.

OUTPUT FORMAT INSTRUCTIONS:
You MUST respond with a valid JSON object matching this exact schema:
{
  "questions": [
    {
      "questionId": "q1",
      "questionNumber": 1,
      "questionText": "Detailed question string...",
      "questionType": "conceptual",
      "targetCompetency": "Core Architecture & Design Patterns",
      "difficultyLevel": "${difficulty}",
      "topicTag": "Specific Concept Tag"
    }
  ]
}
Each question MUST have "questionType" set to one of: "conceptual", "scenario", "coding", "behavioral".
Each question MUST be distinct, non-repetitive, and at least 20 characters long.
Do not wrap your output in conversational markdown. Return only the JSON object.`;

  const userPrompt = `Generate exactly ${count} unique ${category} interview questions tailored for a ${experienceLevel} applying as a "${targetRole}" at ${difficulty} difficulty.`;

  // execution loop supporting 1 automatic retry on transient failure below this code block (AI-004)
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // invoke groq chat completions api with structured json mode below this code block
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error('Groq API returned an empty completion content.');
      }

      // clean markdown fences before parsing below this code block
      const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // validate questions array and deduplicate below this code block
      const validation = validateAndFormatQuestions(
        parsed.questions,
        count,
        category,
        difficulty,
        targetRole
      );
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // return validated formatted questions list below this code block
      return validation.questions;
    } catch (err) {
      lastError = err;

      // check if error is a 404 model not found or a 429 rate limit below this code block
      const is404 = isModelNotFoundError(err);
      const is429 = isRateLimitError(err);

      if (is404 || is429) {
        // log specific 404 model error or 429 rate limit below this code block
        console.error(
          `[Groq AI Service] Groq API call encountered ${is404 ? '404 model_not_found for model "' + model + '"' : '429 rate limit'}:`,
          err.message
        );

        // return pre-structured fallback questions immediately to prevent route 500/502 crash below this code block
        return generateFallbackQuestions({
          targetRole,
          experienceLevel,
          category,
          difficulty,
          count
        });
      }

      // log warning for transient failures on attempt below this code block
      console.warn(`[Groq AI Service] Question generation attempt ${attempt} failed:`, err.message);

      // if on attempt 1, loop continues to perform single automatic retry below this code block (AI-004)
      if (attempt < maxAttempts) {
        // short 500ms delay before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // if all retry attempts were exhausted, log and return pre-structured fallback questions below this code block
  console.error(
    '[Groq AI Service] Groq API question generation failed after retries. Falling back to pre-structured questions:',
    lastError?.message || 'Unknown Groq error'
  );

  return generateFallbackQuestions({
    targetRole,
    experienceLevel,
    category,
    difficulty,
    count
  });
};

// interview evaluation service invoking groq api with deterministic fallback scoring below this code block
const evaluateInterviewAnswers = async (interview) => {
  // verify model uses llama-3.1-8b-instant fallback and never llama-3.3-70b-versatile below this code block
  let model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  if (model === 'llama-3.3-70b-versatile') {
    model = 'llama-3.1-8b-instant';
  }

  // attempt initialization of groq client below this code block
  let groq;
  try {
    groq = getGroqClient();
  } catch (clientErr) {
    console.warn('[Groq Evaluation Service] Groq client initialization warning:', clientErr.message);
    return calculateFallbackScoring(interview);
  }

  const { targetRole = 'Software Engineer', experienceLevel = 'Entry-level', category = 'Technical', difficulty = 'Intermediate', questions = [] } = interview;

  // build category-aware rubric guidance below this code block
  const isHRorBehavioral = category === 'HR' || category === 'Behavioral';
  const technicalAccuracyGuidance = isHRorBehavioral
    ? `For "${category}" category interviews, "technicalAccuracy" MUST evaluate Situational & Professional Soundness (Max 40 points).
Grade whether the response demonstrates sound professional judgment, realistic workplace behavior, ethical awareness, interpersonal maturity, and role-appropriate competency (e.g., STAR method logic). Do NOT penalize for lack of software coding syntax.`
    : `For "${category}" category interviews, "technicalAccuracy" MUST evaluate factual correctness, conceptual depth, accurate terminology, APIs, debugging methodology, and architectural soundness for ${targetRole} (Max 40 points).`;

  // detailed system instructions for groq answer evaluation below this code block
  const systemPrompt = `You are a Principal Engineering Director and Senior Hiring Panel Lead.
Your responsibility is to rigorously and transparently evaluate candidate interview answers according to the mandatory 100-point weighted rubric.

MANDATORY 100-POINT WEIGHTED RUBRIC CRITERIA:
1. technicalAccuracy (Max 40 points):
   ${technicalAccuracyGuidance}
   - Score Range: 0 to 40.
2. relevance (Max 25 points):
   - Directly addresses the specific prompt asked without rambling, evasiveness, or irrelevant tangents.
   - Score Range: 0 to 25.
3. clarity (Max 20 points):
   - Logical organization, readability, professional vocabulary, structured delivery (e.g., Situation, Task, Action, Result).
   - Score Range: 0 to 20.
4. completeness (Max 15 points):
   - Sufficient depth, concrete examples, edge cases, outcomes, and business impact covered.
   - Score Range: 0 to 15.

INTERVIEW CONTEXT:
- Target Job Role: ${targetRole}
- Candidate Experience Level: ${experienceLevel}
- Category Track: ${category}
- Difficulty Tier: ${difficulty}
- Total Questions Evaluated: ${questions.length}

OUTPUT FORMAT SPECIFICATION:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "evaluations": [
    {
      "questionNumber": 1,
      "technicalAccuracy": 35,
      "relevance": 22,
      "clarity": 18,
      "completeness": 13,
      "feedback": "2-3 sentences of balanced, constructive, actionable critique.",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement area 1", "Specific improvement area 2"],
      "suggestedAnswer": "Complete, exemplary model response written in first-person professional phrasing that would earn a 100/100 score.",
      "topicsToPractice": ["Topic A", "Topic B"]
    }
  ],
  "summaryFeedback": {
    "overallSummary": "High-level 2-3 sentence executive summary of overall candidate performance across the session.",
    "keyStrengths": ["Major strength across all answers", "Another prominent asset"],
    "keyWeaknesses": ["Key recurring gap observed", "Secondary area needing focus"],
    "topicsToPractice": ["Recommended study topic 1", "Recommended study topic 2", "Recommended study topic 3"]
  }
}
Do NOT include markdown formatting or extra commentary outside the JSON object.`;

  const userPayload = questions.map((q) => ({
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    topicTag: q.topicTag || q.targetCompetency,
    userAnswer: q.userAnswer,
  }));

  const userPrompt = `Evaluate the following ${questions.length} interview responses against the 100-point rubric for candidate targeting "${targetRole}" (${experienceLevel} level, ${difficulty} difficulty):\n\n${JSON.stringify(userPayload, null, 2)}`;

  // try evaluating with groq api, with deterministic rubric fallback on any failure or timeout below this code block
  try {
    // invoke groq chat completions api with structured json mode below this code block
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const rawText = completion.choices[0]?.message?.content;
    if (!rawText) {
      throw new Error('Groq API returned an empty evaluation response.');
    }

    // clean markdown fences before parsing below this code block
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed || !Array.isArray(parsed.evaluations)) {
      throw new Error('Groq evaluation response missing "evaluations" array.');
    }

    // validate scores against rubric boundaries below this code block
    const scoringResult = calculateAuthoritativeScores(parsed.evaluations, questions);

    const rawSummary = parsed.summaryFeedback || {};
    const summaryFeedback = {
      overallSummary:
        typeof rawSummary.overallSummary === "string" &&
        rawSummary.overallSummary.trim().length > 0
          ? rawSummary.overallSummary.trim()
          : `Completed ${category} practice session for ${targetRole} with an overall score of ${scoringResult.overallScore}/100.`,
      keyStrengths:
        Array.isArray(rawSummary.keyStrengths) && rawSummary.keyStrengths.length > 0
          ? rawSummary.keyStrengths.map((s) => String(s).trim()).filter(Boolean)
          : ["Consistent effort in articulating structured responses."],
      keyWeaknesses:
        Array.isArray(rawSummary.keyWeaknesses) && rawSummary.keyWeaknesses.length > 0
          ? rawSummary.keyWeaknesses.map((s) => String(s).trim()).filter(Boolean)
          : ["Add more real-world quantifiable examples to strengthen impact."],
      topicsToPractice:
        Array.isArray(rawSummary.topicsToPractice) && rawSummary.topicsToPractice.length > 0
          ? rawSummary.topicsToPractice.map((s) => String(s).trim()).filter(Boolean)
          : [category, targetRole],
    };

    return {
      evaluatedQuestions: scoringResult.evaluatedQuestions,
      criterionAverages: scoringResult.criterionAverages,
      overallScore: scoringResult.overallScore,
      summaryFeedback
    };
  } catch (err) {
    // log error and return deterministic rubric fallback without throwing 502 below this code block
    console.warn(
      '[Groq Evaluation Service] AI evaluation call encountered an issue. Using deterministic rubric fallback:',
      err.message
    );

    return calculateFallbackScoring(interview);
  }
};

// export groq service methods below this code block
module.exports = {
  generateInterviewQuestions,
  generateFallbackQuestions,
  evaluateInterviewAnswers,
  calculateFallbackScoring,
  calculateAuthoritativeScores,
};
