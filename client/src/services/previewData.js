// imports and comments below this code block
// isolated design preview data for Stage 2 frontend testing
// to be replaced by live MongoDB Atlas and Groq API calls in Stages 3 through 7

// mock authenticated user profile data below this code block
export const PREVIEW_USER = {
  id: 'usr_preview_001',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  role: 'Aspiring Full-Stack Software Engineer',
  joinedDate: 'October 17, 2026',
  themePreference: 'dark'
};

// populated dashboard kpi metrics below this code block
export const PREVIEW_KPIS = {
  completedInterviews: 4,
  averageScore: 78.5,
  questionsAnswered: 25,
  scoreDelta: '+6.2'
};

// empty dashboard kpi metrics for new users below this code block
export const PREVIEW_EMPTY_KPIS = {
  completedInterviews: 0,
  averageScore: null,
  questionsAnswered: 0,
  scoreDelta: null
};

// chronological score progression series for recharts below this code block
export const PREVIEW_SCORE_TREND = [
  {
    sessionNumber: 'Session 1',
    role: 'Frontend React Intern',
    category: 'Technical',
    score: 68,
    date: '2026-10-10',
    formattedDate: 'Oct 10'
  },
  {
    sessionNumber: 'Session 2',
    role: 'Node.js Backend Trainee',
    category: 'Technical',
    score: 74,
    date: '2026-10-12',
    formattedDate: 'Oct 12'
  },
  {
    sessionNumber: 'Session 3',
    role: 'Junior Software Engineer',
    category: 'Behavioral',
    score: 73,
    date: '2026-10-15',
    formattedDate: 'Oct 15'
  },
  {
    sessionNumber: 'Session 4',
    role: 'Full-Stack MERN Developer',
    category: 'Role-based',
    score: 84,
    date: '2026-10-17',
    formattedDate: 'Oct 17'
  }
];

// list of recent interview sessions with various statuses below this code block
export const PREVIEW_RECENT_INTERVIEWS = [
  {
    id: 'int_session_001',
    role: 'Full-Stack MERN Developer',
    category: 'Technical',
    difficulty: 'Intermediate',
    experienceLevel: 'Fresher',
    questionCount: 5,
    status: 'completed',
    score: 84,
    date: '2026-10-17',
    dateLabel: 'Today, 2:30 PM',
    completedAt: '2026-10-17T09:00:00.000Z'
  },
  {
    id: 'int_session_002',
    role: 'Junior Backend Engineer',
    category: 'Role-based',
    difficulty: 'Intermediate',
    experienceLevel: 'Entry-level',
    questionCount: 10,
    status: 'completed',
    score: 73,
    date: '2026-10-15',
    dateLabel: 'Oct 15, 2026',
    completedAt: '2026-10-15T11:45:00.000Z'
  },
  {
    id: 'int_session_003',
    role: 'Campus Placement Behavioral Interview',
    category: 'Behavioral',
    difficulty: 'Beginner',
    experienceLevel: 'Fresher',
    questionCount: 5,
    status: 'in_progress',
    progress: '2 / 5 Questions',
    score: null,
    date: '2026-10-14',
    dateLabel: 'Oct 14, 2026',
    completedAt: null
  },
  {
    id: 'int_session_004',
    role: 'Node.js & Cloud System Engineer',
    category: 'Technical',
    difficulty: 'Advanced',
    experienceLevel: 'Experienced',
    questionCount: 5,
    status: 'evaluation_failed',
    score: null,
    date: '2026-10-13',
    dateLabel: 'Oct 13, 2026',
    completedAt: null
  }
];

// 4-criterion rubric mastery normalized data for recharts below this code block
export const PREVIEW_CRITERIA_MASTERY = [
  {
    criterion: 'Technical Accuracy',
    score: 34,
    maxScore: 40,
    percentage: 85,
    weight: '40%',
    color: '#6366F1'
  },
  {
    criterion: 'Relevance',
    score: 22,
    maxScore: 25,
    percentage: 88,
    weight: '25%',
    color: '#10B981'
  },
  {
    criterion: 'Clarity & Comm.',
    score: 16,
    maxScore: 20,
    percentage: 80,
    weight: '20%',
    color: '#3B82F6'
  },
  {
    criterion: 'Completeness',
    score: 11.5,
    maxScore: 15,
    percentage: 76.7,
    weight: '15%',
    color: '#F59E0B'
  }
];

// performance breakdown by category for recharts below this code block
export const PREVIEW_CATEGORY_BREAKDOWN = [
  { category: 'Technical', sessions: 2, avgScore: 76, color: '#6366F1' },
  { category: 'Behavioral', sessions: 1, avgScore: 73, color: '#10B981' },
  { category: 'Role-based', sessions: 1, avgScore: 84, color: '#8B5CF6' },
  { category: 'HR', sessions: 0, avgScore: 0, color: '#F59E0B' }
];

// recurring practice topics synthesized across evaluations below this code block
export const PREVIEW_PRACTICE_TOPICS = [
  {
    id: 'top_01',
    topic: 'MongoDB Multi-Document ACID Transactions',
    category: 'Technical',
    frequency: 'Cited in 3 reports',
    recommendation: 'Practice explaining write concerns, replica set consensus, and session-based transactions in Mongoose.'
  },
  {
    id: 'top_02',
    topic: 'React 19 Server Actions & Optimistic Updates',
    category: 'Technical',
    frequency: 'Cited in 2 reports',
    recommendation: 'Review useActionState, useOptimistic, and non-blocking background DOM renders.'
  },
  {
    id: 'top_03',
    topic: 'STAR Method Framework Execution',
    category: 'Behavioral',
    frequency: 'Cited in 2 reports',
    recommendation: 'Ensure situational responses clearly isolate the Situation, Task, your specific Action, and quantifiable Results.'
  }
];

// active interview questions for live session preview below this code block
export const PREVIEW_ACTIVE_QUESTIONS = [
  {
    id: 1,
    questionNumber: 1,
    category: 'Technical',
    difficulty: 'Intermediate',
    topicTag: 'Database Architecture',
    question: 'Can you explain the key differences between SQL and NoSQL databases, and when you would choose MongoDB over PostgreSQL in a MERN stack application?',
    hint: 'Think about schema flexibility, scaling patterns, ACID guarantees, and JSON document structures.',
    draftAnswer: 'SQL databases use structured schemas and relational tables with ACID transactions, whereas NoSQL databases like MongoDB store flexible JSON-like documents. In a MERN application, MongoDB works natively with JavaScript JSON objects, allowing rapid schema iteration and horizontal scaling without complex schema migrations.'
  },
  {
    id: 2,
    questionNumber: 2,
    category: 'Technical',
    difficulty: 'Intermediate',
    topicTag: 'Frontend Frameworks',
    question: 'How does the React 19 reconciliation algorithm work under the hood, and what problems does the Virtual DOM solve compared to direct DOM manipulation?',
    hint: 'Discuss diffing heuristics, component trees, batch updates, and fiber nodes.',
    draftAnswer: 'React maintains an in-memory Virtual DOM tree representation of the UI. When state changes occur, React creates a new virtual DOM tree and performs a reconciliation diff algorithm. Instead of repainting the browser DOM repeatedly, React batches mutations and applies only the calculated minimum diff to the real DOM, avoiding expensive layout reflows.'
  },
  {
    id: 3,
    questionNumber: 3,
    category: 'Technical',
    difficulty: 'Intermediate',
    topicTag: 'Security & Auth',
    question: 'Describe how you secure RESTful APIs in an Express.js backend. What role do JWTs, bcryptjs, and CORS play in preventing common attacks?',
    hint: 'Cover stateless token verification, salted password hashing, and origin whitelisting.',
    draftAnswer: 'RESTful security in Express requires multiple defense layers. bcryptjs safely hashes passwords with cryptographic salt rounds before saving to MongoDB. JWTs provide stateless authentication headers so the server can verify identity on protected routes. CORS headers restrict unauthorized browser origins from making cross-site requests.'
  },
  {
    id: 4,
    questionNumber: 4,
    category: 'Technical',
    difficulty: 'Intermediate',
    topicTag: 'System Design',
    question: 'How do you handle error boundaries and unhandled promise rejections in an asynchronous Node.js Express server to ensure high uptime?',
    hint: 'Explain try/catch blocks, async middleware wrappers, and global error handlers.',
    draftAnswer: ''
  },
  {
    id: 5,
    questionNumber: 5,
    category: 'Technical',
    difficulty: 'Intermediate',
    topicTag: 'State Management',
    question: 'When would you use React Context API versus specialized state management libraries like Redux or Zustand in a growing web application?',
    hint: 'Address re-render frequency, devtools, boilerplates, and separation of UI vs server state.',
    draftAnswer: ''
  }
];

// comprehensive 100-point rubric report data below this code block
export const PREVIEW_REPORT_DATA = {
  id: 'int_session_001',
  role: 'Full-Stack MERN Developer',
  category: 'Technical',
  experienceLevel: 'Fresher',
  difficulty: 'Intermediate',
  date: 'October 17, 2026',
  questionCount: 5,
  overallScore: 84,
  performanceLevel: 'Strong',
  criteria: [
    {
      name: 'Technical Accuracy',
      score: 34,
      maxScore: 40,
      weight: '40%',
      percentage: 85,
      color: '#6366F1'
    },
    {
      name: 'Relevance',
      score: 22,
      maxScore: 25,
      weight: '25%',
      percentage: 88,
      color: '#10B981'
    },
    {
      name: 'Clarity & Communication',
      score: 16,
      maxScore: 20,
      weight: '20%',
      percentage: 80,
      color: '#3B82F6'
    },
    {
      name: 'Completeness',
      score: 12,
      maxScore: 15,
      weight: '15%',
      percentage: 80,
      color: '#F59E0B'
    }
  ],
  strengths: [
    'Strong conceptual grasp of MongoDB polymorphic document models versus relational SQL tables.',
    'Clear, articulate explanation of React reconciliation and Virtual DOM batching mechanics.',
    'Accurate identification of JWT stateless authorization headers and bcryptjs salt hashing.'
  ],
  weaknesses: [
    'Omitted discussion of MongoDB write concerns and multi-document ACID transactions.',
    'Could provide concrete code snippets illustrating Express.js error middleware ordering.'
  ],
  practiceTopics: [
    'MongoDB Transactions & Aggregation Pipelines',
    'React 19 Server Actions & Non-blocking Transitions',
    'Rate Limiting & CSRF Prevention in Express REST APIs'
  ],
  questions: [
    {
      number: 1,
      topicTag: 'Database Architecture',
      question: 'Can you explain the key differences between SQL and NoSQL databases, and when you would choose MongoDB over PostgreSQL in a MERN stack application?',
      score: 88,
      subScores: { technical: 36, relevance: 23, clarity: 17, completeness: 12 },
      userAnswer: 'SQL databases use structured schemas and relational tables with ACID transactions, whereas NoSQL databases like MongoDB store flexible JSON-like documents. In a MERN application, MongoDB works natively with JavaScript JSON objects, allowing rapid schema iteration and horizontal scaling without complex schema migrations.',
      feedback: 'Strong contrast between relational schemas and polymorphic JSON documents. Correctly emphasized developer velocity in JavaScript ecosystems, but could touch upon ACID transaction guarantees.',
      improvedAnswer: 'SQL databases (such as PostgreSQL) enforce strictly defined schemas, normalized relational tables, and robust multi-record ACID transactions, making them the standard choice for financial workflows and highly relational data models. NoSQL databases (such as MongoDB) store polymorphic JSON-like BSON documents without rigid schema locks. In a MERN stack application, MongoDB is particularly advantageous because frontend JavaScript data structures map 1:1 with backend storage, drastically speeding up iteration and allowing horizontal sharding as data volumes expand.'
    },
    {
      number: 2,
      topicTag: 'Frontend Frameworks',
      question: 'How does the React 19 reconciliation algorithm work under the hood, and what problems does the Virtual DOM solve compared to direct DOM manipulation?',
      score: 84,
      subScores: { technical: 34, relevance: 22, clarity: 16, completeness: 12 },
      userAnswer: 'React maintains an in-memory Virtual DOM tree representation of the UI. When state changes occur, React creates a new virtual DOM tree and performs a reconciliation diff algorithm. Instead of repainting the browser DOM repeatedly, React batches mutations and applies only the calculated minimum diff to the real DOM, avoiding expensive layout reflows.',
      feedback: 'Clear articulation of the diffing algorithm and batch updates. Excellent understanding of avoiding layout thrashing.',
      improvedAnswer: 'Direct browser DOM manipulation is computationally expensive because layout recalculations and style recalculations (reflows and repaints) block the main JavaScript thread. React solves this by maintaining a lightweight in-memory Virtual DOM. During reconciliation, React applies an O(n) heuristic diffing algorithm between the previous and current Virtual DOM trees. It batches the resulting minimal mutations into an optimized update sequence applied directly to the real DOM, ensuring high frame rates and responsive user interactions.'
    },
    {
      number: 3,
      topicTag: 'Security & Auth',
      question: 'Describe how you secure RESTful APIs in an Express.js backend. What role do JWTs, bcryptjs, and CORS play in preventing common attacks?',
      score: 80,
      subScores: { technical: 32, relevance: 21, clarity: 15, completeness: 12 },
      userAnswer: 'RESTful security in Express requires multiple defense layers. bcryptjs safely hashes passwords with cryptographic salt rounds before saving to MongoDB. JWTs provide stateless authentication headers so the server can verify identity on protected routes. CORS headers restrict unauthorized browser origins from making cross-site requests.',
      feedback: 'Good overview of the core security triad. To score higher, mention token expiration and rate limiting.',
      improvedAnswer: 'Securing an Express REST API requires defense-in-depth across the application lifecycle. First, user passwords must be hashed using bcryptjs with a minimum of 10 salt rounds before storage, mitigating offline dictionary and rainbow-table attacks. Second, authentication should use cryptographically signed JWT tokens with short expiration windows transmitted via Authorization Bearer headers. Third, CORS middleware must restrict allowed origins to designated frontend clients, preventing unauthorized cross-origin requests. Additional defenses include helmet for HTTP header security and express-rate-limit to prevent brute-force attacks.'
    }
  ]
};
