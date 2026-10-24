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

// helper function to generate 5 pre-structured relevant interview questions when groq api fails below this code block
const generateFallbackQuestions = ({
  targetRole = 'Software Engineer',
  experienceLevel = 'Entry-level',
  category = 'Technical',
  difficulty = 'Intermediate'
}) => {
  const normalizedRole = (targetRole || '').toLowerCase();
  const normalizedCategory = (category || 'Technical').toLowerCase();
  const normalizedLevel = (experienceLevel || 'Entry-level').toLowerCase();
  const effectiveDifficulty = difficulty || 'Intermediate';

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

  // handle behavioral and hr category tracks below this code block
  if (normalizedCategory === 'behavioral' || normalizedCategory === 'hr') {
    return [
      {
        questionId: 'q1',
        questionNumber: 1,
        questionText: `Describe a challenging project where you collaborated with cross-functional team members for ${targetRole}. What was your specific role and how did you resolve differing priorities?`,
        questionType: 'behavioral',
        targetCompetency: 'Cross-Functional Collaboration & Communication',
        difficultyLevel: effectiveDifficulty,
        topicTag: 'Teamwork & Alignment',
        userAnswer: '',
        answeredAt: null,
        evaluation: null
      },
      {
        questionId: 'q2',
        questionNumber: 2,
        questionText: `Tell me about a situation where project requirements changed drastically mid-sprint before a critical release. How did you assess trade-offs and adapt your delivery?`,
        questionType: 'scenario',
        targetCompetency: 'Adaptability & Agile Prioritization',
        difficultyLevel: effectiveDifficulty,
        topicTag: 'Sprint Agility',
        userAnswer: '',
        answeredAt: null,
        evaluation: null
      },
      {
        questionId: 'q3',
        questionNumber: 3,
        questionText: `Can you share an experience where you had a strong disagreement with a colleague or lead regarding a technical decision? How did you present your case and reach alignment?`,
        questionType: 'behavioral',
        targetCompetency: 'Constructive Conflict Resolution',
        difficultyLevel: effectiveDifficulty,
        topicTag: 'Conflict Management',
        userAnswer: '',
        answeredAt: null,
        evaluation: null
      },
      {
        questionId: 'q4',
        questionNumber: 4,
        questionText: `Describe a time when a feature you shipped or worked on caused an unexpected issue in production. How did you take ownership, communicate with stakeholders, and prevent recurrence?`,
        questionType: 'scenario',
        targetCompetency: 'Accountability & Incident Remediation',
        difficultyLevel: effectiveDifficulty,
        topicTag: 'Ownership & Post-Mortem',
        userAnswer: '',
        answeredAt: null,
        evaluation: null
      },
      {
        questionId: 'q5',
        questionNumber: 5,
        questionText: `How do you prioritize continuous professional learning and staying updated with emerging trends and best practices relevant to a ${targetRole}?`,
        questionType: 'behavioral',
        targetCompetency: 'Continuous Learning & Self-Improvement',
        difficultyLevel: effectiveDifficulty,
        topicTag: 'Career Growth',
        userAnswer: '',
        answeredAt: null,
        evaluation: null
      }
    ];
  }

  // question banks organized by domain and experience level below this code block
  const domainQuestions = {
    frontend: {
      fresher: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Explain the Virtual DOM and reconciliation in modern frontend libraries. How does it optimize rendering performance compared to direct browser DOM manipulation?',
          questionType: 'conceptual',
          targetCompetency: 'Virtual DOM & Rendering Pipeline',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'DOM & Rendering'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'A user search-as-you-type autocomplete triggers sluggish UI re-renders and excessive network requests. How would you diagnose and resolve this performance bottleneck?',
          questionType: 'scenario',
          targetCompetency: 'Frontend Performance & Event Debouncing',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Performance Tuning'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How would you implement a custom debounced input hook or handler in React that cleanly manages loading, data, and error states?',
          questionType: 'coding',
          targetCompetency: 'Component Lifecycle & Custom Hooks',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'React Hooks'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'A web application crashes with a blank screen when an API returns unexpected null values. How do you implement defensive error boundaries and fallback UI in a component tree?',
          questionType: 'scenario',
          targetCompetency: 'Defensive UI & Error Boundaries',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Error Handling'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe an academic or personal frontend project you built. What was the most challenging UI problem you encountered and how did you solve it?',
          questionType: 'behavioral',
          targetCompetency: 'Project Execution & Technical Problem Solving',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Project Experience'
        }
      ],
      experienced: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Compare micro-frontends with monolithic frontend architectures. How do you address independent deployment, routing isolation, and shared state across distributed product teams?',
          questionType: 'conceptual',
          targetCompetency: 'Micro-Frontend & System Architecture',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Architecture'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'A real-time financial dashboard leaks memory and freezes the browser main thread during WebSocket burst traffic. Walk through your systematic profiling and remediation strategy.',
          questionType: 'scenario',
          targetCompetency: 'Runtime Memory Profiling & WebSockets',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Performance Profiling'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How would you architect an offline-first data caching and optimistic update synchronization engine utilizing Service Workers and IndexedDB?',
          questionType: 'coding',
          targetCompetency: 'Offline Storage & Optimistic UI',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Service Workers'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'How do you design, govern, and maintain an enterprise design system across multiple web properties with automated visual regression testing in CI/CD?',
          questionType: 'scenario',
          targetCompetency: 'Design System Governance & Visual Regression',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Design Systems'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Tell me about a time you had to push back against a tight product deadline to remediate critical frontend technical debt. How did you justify the business value to leadership?',
          questionType: 'behavioral',
          targetCompetency: 'Technical Leadership & Stakeholder Management',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Engineering Leadership'
        }
      ],
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Compare component-level state with global state management (Context API, Redux Toolkit, Zustand). When is global state justified versus localized state in a web application?',
          questionType: 'conceptual',
          targetCompetency: 'State Architecture & Data Flow',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'State Management'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Your frontend initial JavaScript bundle has grown to 8MB, resulting in poor Core Web Vitals on mobile networks. What specific bundle analysis and code-splitting steps would you take?',
          questionType: 'scenario',
          targetCompetency: 'Bundle Optimization & Code Splitting',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Core Web Vitals'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Describe how to build an accessible, keyboard-navigable modal dialog or virtualized list from scratch without relying on heavy third-party UI libraries.',
          questionType: 'coding',
          targetCompetency: 'Accessibility & Component Construction',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'WAI-ARIA Accessibility'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'How do you structure CSS for maintainability and scalability across a growing team? Discuss trade-offs between CSS Modules, Tailwind CSS, and CSS-in-JS.',
          questionType: 'scenario',
          targetCompetency: 'CSS Architecture & Styling Maintainability',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Styling Architecture'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a situation where you received rigorous critique during a code review regarding your component design. How did you evaluate and apply that feedback?',
          questionType: 'behavioral',
          targetCompetency: 'Code Review & Engineering Collaboration',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Collaboration'
        }
      ]
    },
    backend: {
      fresher: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Explain the core architectural differences between relational (SQL) and document (NoSQL) databases, and when you would select MongoDB over PostgreSQL for a backend service.',
          questionType: 'conceptual',
          targetCompetency: 'Database Modeling & Storage Paradigms',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'SQL vs NoSQL'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'A REST API endpoint takes over 5 seconds to query user records. What diagnostic steps would you take in your database indexes and server logs to locate the bottleneck?',
          questionType: 'scenario',
          targetCompetency: 'Query Optimization & Indexing',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Database Profiling'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Describe how you implement secure token-based authentication using JWTs, bcrypt password hashing, and authorization middleware in an Express.js server.',
          questionType: 'coding',
          targetCompetency: 'Authentication & Endpoint Security',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'JWT Authentication'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'Explain the difference between synchronous blocking operations and asynchronous non-blocking event loops. How does this architecture handle high concurrency?',
          questionType: 'scenario',
          targetCompetency: 'Event Loop & Concurrency Mechanics',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Event-Driven Architecture'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Walk me through a challenging backend bug or unexpected server crash you resolved in a recent project. What was your systematic troubleshooting methodology?',
          questionType: 'behavioral',
          targetCompetency: 'Debugging Methodology & Root Cause Analysis',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Troubleshooting'
        }
      ],
      experienced: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'How do you apply the CAP theorem, eventual consistency models, and distributed consensus mechanisms when designing a distributed backend for a mission-critical service?',
          questionType: 'conceptual',
          targetCompetency: 'Distributed Systems & CAP Theorem',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Distributed Systems'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'You need to scale a core write-heavy service from 2,000 writes/sec to 100,000 writes/sec with sub-50ms latency. Describe your database sharding, caching, and message broker strategy.',
          questionType: 'scenario',
          targetCompetency: 'High-Throughput Architecture & Sharding',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'System Scaling'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How would you implement a distributed sliding-window rate limiter across clustered API server nodes using Redis and Lua script atomicity?',
          questionType: 'coding',
          targetCompetency: 'Distributed Caching & Algorithm Design',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Rate Limiting'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'Walk through a zero-downtime database schema migration strategy for a table with 50 million records without locking writes or degrading API read performance.',
          questionType: 'scenario',
          targetCompetency: 'Zero-Downtime Database Migrations',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Database Migrations'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a high-stakes architectural decision where you had to lead a migration from a legacy monolithic service into independent services. How did you mitigate risk?',
          questionType: 'behavioral',
          targetCompetency: 'Architectural Leadership & Risk Mitigation',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'System Evolution'
        }
      ],
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Compare RESTful API design with GraphQL and gRPC. What are the key trade-offs regarding network payload size, caching support, and schema evolution?',
          questionType: 'conceptual',
          targetCompetency: 'API Architecture & Protocols',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'API Protocols'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Your backend service experiences database connection pool exhaustion during peak hours. How do you configure pool sizes, timeouts, and connection lifecycles to maintain uptime?',
          questionType: 'scenario',
          targetCompetency: 'Connection Pool Management & Resilience',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Connection Pooling'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How do you design an idempotent API endpoint for payment processing or order checkout to safely handle network retries without duplicate charges?',
          questionType: 'coding',
          targetCompetency: 'API Idempotency & Transaction Safety',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Idempotency'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'Describe your defensive strategy for securing backend APIs against common vulnerabilities like SQL/NoSQL injection, Broken Object Level Authorization (BOLA), and CSRF.',
          questionType: 'scenario',
          targetCompetency: 'Application Security & Threat Prevention',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'API Security'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Tell me about an incident where a backend release caused an unexpected outage or regression. How did you coordinate triage, rollback, and team communication?',
          questionType: 'behavioral',
          targetCompetency: 'Incident Management & Production Accountability',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Incident Response'
        }
      ]
    },
    fullstack: {
      fresher: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Trace the complete lifecycle of a web request from a user clicking a button in the browser to server routing, database queries, and response re-rendering.',
          questionType: 'conceptual',
          targetCompetency: 'Full-Stack Architecture & Request Lifecycle',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Request Lifecycle'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Users report intermittent session loss when navigating between frontend views. How would you investigate cookie flags, localStorage security, and token expiration?',
          questionType: 'scenario',
          targetCompetency: 'Session Persistence & Token Lifecycle',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Session Management'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How do you coordinate validation logic between frontend forms and backend controllers, and why must backend validation remain strictly authoritative?',
          questionType: 'coding',
          targetCompetency: 'Authoritative Validation & Data Sanitization',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Data Validation'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'Explain Cross-Origin Resource Sharing (CORS). Why do browsers enforce CORS restrictions, and how do you properly configure CORS headers on the server?',
          questionType: 'scenario',
          targetCompetency: 'CORS Protocol & Web Security',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'CORS Configuration'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Tell me about your most comprehensive full-stack application. What architectural choices were you proud of, and what would you refactor if building it today?',
          questionType: 'behavioral',
          targetCompetency: 'Project Architecture & Critical Reflection',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Project Experience'
        }
      ],
      experienced: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'How do you determine the boundary between a modular monolith and microservices when designing an extensible application architecture for a growing team?',
          questionType: 'conceptual',
          targetCompetency: 'System Decomposition & Modular Architecture',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Architecture Strategy'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'A critical third-party API begins failing with high latency, causing cascading thread exhaustion in your application. How do you implement circuit breakers and fallback queues?',
          questionType: 'scenario',
          targetCompetency: 'Fault Tolerance & Circuit Breaking',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Resilience Patterns'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Architect a real-time collaborative workspace supporting concurrent user edits, conflict resolution, and reliable WebSocket state synchronization.',
          questionType: 'coding',
          targetCompetency: 'Real-Time Synchronization & Concurrency',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'WebSockets & Concurrency'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'Design a production CI/CD deployment pipeline incorporating automated unit and end-to-end tests, container staging, and zero-downtime blue-green deployments.',
          questionType: 'scenario',
          targetCompetency: 'Continuous Delivery & Zero-Downtime Deployment',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'CI/CD Pipelines'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a situation where you had to mentor other developers on architectural standards while maintaining aggressive feature velocity under tight deadlines.',
          questionType: 'behavioral',
          targetCompetency: 'Technical Mentorship & Delivery Leadership',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Mentorship'
        }
      ],
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Compare Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG). When should each approach be selected based on performance and SEO needs?',
          questionType: 'conceptual',
          targetCompetency: 'Rendering Paradigms & Web Performance',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Rendering Strategies'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Your full-stack application experiences performance degradation under moderate concurrency. How do you systematically profile both frontend rendering and backend event loop delays?',
          questionType: 'scenario',
          targetCompetency: 'Full-Stack Performance Diagnostics',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Performance Diagnostics'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'How would you architect a secure direct-to-cloud file upload pipeline utilizing presigned URLs to prevent server memory bloat and protect storage credentials?',
          questionType: 'coding',
          targetCompetency: 'Cloud Storage Integration & Presigned URLs',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'File Upload Pipeline'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'How do you guarantee ACID transaction integrity when creating a record involves multiple dependent database updates across related collections or tables?',
          questionType: 'scenario',
          targetCompetency: 'Database Transactions & Consistency',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Database Transactions'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a project where you had to balance feature delivery speed against code quality or test coverage. How did you determine what trade-offs were acceptable?',
          questionType: 'behavioral',
          targetCompetency: 'Engineering Trade-offs & Quality Balance',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Engineering Trade-offs'
        }
      ]
    },
    devops: {
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Explain the architectural distinctions between containerization (Docker) and virtual machines, detailing how namespaces and cgroups isolate processes.',
          questionType: 'conceptual',
          targetCompetency: 'Containerization & Linux Internals',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Docker Architecture'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'A production Kubernetes Pod repeatedly crashes with an OOMKilled status. How do you investigate memory limits, heap allocation, and node pressure?',
          questionType: 'scenario',
          targetCompetency: 'Kubernetes Troubleshooting & Resource Management',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Kubernetes Troubleshooting'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Describe how to construct a hardened, multi-stage Docker build that minimizes image size, eliminates development dependencies, and runs as an unprivileged user.',
          questionType: 'coding',
          targetCompetency: 'Container Hardening & Multi-Stage Builds',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Dockerfile Best Practices'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'How do you manage Infrastructure as Code (IaC) with Terraform while preventing state locking conflicts, drift, and accidental resource deletions?',
          questionType: 'scenario',
          targetCompetency: 'Infrastructure as Code & State Management',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Terraform IaC'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a critical production outage or on-call incident you resolved. How did you communicate with stakeholders and conduct a blameless post-mortem?',
          questionType: 'behavioral',
          targetCompetency: 'Incident Management & Blameless Post-Mortems',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Post-Mortem & Incident Response'
        }
      ]
    },
    data: {
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Explain the bias-variance trade-off in predictive modeling and how regularization techniques (L1/L2) influence model complexity and generalizability.',
          questionType: 'conceptual',
          targetCompetency: 'Statistical Modeling & Machine Learning Core',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Bias-Variance Trade-off'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'Your training dataset has severe 99:1 class imbalance for fraud detection. Why is raw accuracy a flawed metric, and what techniques and metrics would you use instead?',
          questionType: 'scenario',
          targetCompetency: 'Imbalanced Classification & Evaluation Metrics',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Imbalanced Datasets'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: 'Walk through an end-to-end data preprocessing pipeline in Python handling missing values, categorical encoding, feature scaling, and data leakage prevention.',
          questionType: 'coding',
          targetCompetency: 'Data Engineering & Pipeline Construction',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Feature Engineering'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: 'How do you monitor machine learning models in production for concept drift, data drift, and latency degradation over time?',
          questionType: 'scenario',
          targetCompetency: 'MLOps & Model Monitoring',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'MLOps & Drift'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: 'Describe a data science or ML project where initial results did not meet stakeholder business expectations. How did you iterate and pivot your strategy?',
          questionType: 'behavioral',
          targetCompetency: 'Stakeholder Alignment & Iterative Problem Solving',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Project Communication'
        }
      ]
    },
    general: {
      default: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: `What are the core foundational principles, architectural patterns, and industry best practices that define technical excellence for a ${targetRole}?`,
          questionType: 'conceptual',
          targetCompetency: `${targetRole} Core Competencies`,
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Core Principles'
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: `You encounter an unexpected high-priority production issue impacting users in your role as ${targetRole}. How do you structure your investigation, triage, and root cause analysis?`,
          questionType: 'scenario',
          targetCompetency: 'Problem Solving & Production Triage',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Production Triage'
        },
        {
          questionId: 'q3',
          questionNumber: 3,
          questionText: `Describe how you design, implement, and test a modular, resilient feature or service to solve a complex functional requirement for a ${targetRole}.`,
          questionType: 'coding',
          targetCompetency: 'Technical Design & Implementation',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Technical Implementation'
        },
        {
          questionId: 'q4',
          questionNumber: 4,
          questionText: `How do you assess and balance trade-offs between delivery speed, performance, scalability, and code maintainability when planning technical tasks?`,
          questionType: 'scenario',
          targetCompetency: 'Trade-off Evaluation & Architecture',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Architecture Trade-offs'
        },
        {
          questionId: 'q5',
          questionNumber: 5,
          questionText: `Tell me about a high-impact technical initiative or academic project you completed for ${targetRole}. What were the key challenges and how did you overcome them?`,
          questionType: 'behavioral',
          targetCompetency: 'Project Delivery & Technical Accountability',
          difficultyLevel: effectiveDifficulty,
          topicTag: 'Project Delivery'
        }
      ]
    }
  };

  // select questions based on resolved domain and experience level below this code block
  const domainGroup = domainQuestions[domain] || domainQuestions.general;
  let selectedList = domainGroup.default;

  if (normalizedLevel === 'fresher' && domainGroup.fresher) {
    selectedList = domainGroup.fresher;
  } else if (normalizedLevel === 'experienced' && domainGroup.experienced) {
    selectedList = domainGroup.experienced;
  }

  // attach default user answer and evaluation fields to every fallback question below this code block
  return selectedList.map((item, idx) => ({
    questionId: item.questionId || `q${idx + 1}`,
    questionNumber: idx + 1,
    questionText: item.questionText,
    questionType: item.questionType || 'conceptual',
    targetCompetency: item.targetCompetency || `${targetRole} Core Skills`,
    difficultyLevel: item.difficultyLevel || effectiveDifficulty,
    topicTag: item.topicTag || 'General',
    userAnswer: '',
    answeredAt: null,
    evaluation: null
  }));
};

// interview question generation service invoking groq api below this code block (AI-001 to AI-004)
const generateInterviewQuestions = async ({
  targetRole,
  experienceLevel,
  category,
  difficulty,
  questionCount = 5
}) => {
  // resolve target groq model with llama-3.1-8b-instant default fallback below this code block
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

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
      difficulty
    });
  }

  // detailed system instructions for groq interviewer below this code block
  const systemPrompt = `You are a Principal Software Architect and Executive Interviewer.
Your task is to generate realistic, professional, and role-appropriate interview questions for a mock interview session.

CONFIGURATION PARAMETERS:
- Target Job Role: ${targetRole}
- Candidate Experience Level: ${experienceLevel}
- Interview Category Track: ${category}
- Difficulty Tier: ${difficulty}
- Total Questions Required: ${questionCount}

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

  const userPrompt = `Generate exactly ${questionCount} unique ${category} interview questions tailored for a ${experienceLevel} applying as a "${targetRole}" at ${difficulty} difficulty.`;

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

      // sanitize and parse json output inside try block below this code block
      const sanitized = sanitizeJsonResponse(rawContent);
      const parsed = JSON.parse(sanitized);

      // validate questions array and deduplicate below this code block
      const validation = validateAndFormatQuestions(
        parsed.questions,
        questionCount,
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
          difficulty
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
    difficulty
  });
};

// export groq service methods below this code block
module.exports = {
  generateInterviewQuestions,
  generateFallbackQuestions
};
