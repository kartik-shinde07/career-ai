# Career AI — Intelligent Mock Interview & Performance Evaluation Platform

A modern, production-hardened full-stack MERN (MongoDB, Express.js, React 19, Node.js) web application designed to help college students, BCA/B.Tech graduates, and aspiring software engineers prepare for technical, behavioral, HR, and role-based job interviews with structured, 100-point rubric-based AI evaluations.

---

## 1. Project Overview & Key Features

### 1.1 Purpose & Target Audience
Traditional interview preparation is often unstructured, high-stress, and devoid of actionable feedback. Career AI bridges this gap by providing an on-demand, interactive interview workspace paired with an authoritative 100-point scoring rubric powered by high-speed Groq AI inference (`llama-3.3-70b-versatile`).

### 1.2 Core Application Workflow
```text
[ Configure ] ───> [ Practice ] ───> [ Evaluate ] ───> [ Review ] ───> [ Track ]
  Select role,       Sequential        100-point         Detailed report    Historical trends
  category, &        questions &       server-validated  with feedback &    & analytics
  difficulty         word counts       AI rubric         rewrites           dashboards
```

1. **Configure (`/interview/new`):** The user selects their target role (e.g., Full Stack MERN Developer, Frontend React Developer), experience tier (`Fresher`, `Entry-level`, `Experienced`), interview category (`Technical`, `Behavioral`, `HR`, `Role-based`), difficulty (`Beginner`, `Intermediate`, `Advanced`), and question count (`5`, `10`, `15`).
2. **Practice (`/interview/:id/session`):** The user answers questions sequentially with real-time character and word count tracking, question navigation jump chips, draft auto-saving, and input validation.
3. **Evaluate:** On submission, the backend coordinates with Groq AI to critique responses across 4 distinct criteria. The server validates, clamps, and recalculates all subscores to guarantee mathematical consistency.
4. **Review (`/interview/:id/report`):** Candidate inspects an executive summary, score cards, qualitative feedback, candidate strengths, growth areas, recommended practice topics, and suggested model answer rewrites.
5. **Track (`/dashboard`, `/history`, `/analytics`):** Track performance progress over time via historical interview tables, aggregate KPI cards, score trend area charts, and 4-criterion radar/bar breakdown visualizations.

---

## 2. Technology Stack

### Frontend Architecture
- **Core Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/) (Ultra-fast HMR, modern ES modules)
- **Programming Language:** JavaScript (`.js` / `.jsx` exclusively — Zero TypeScript runtime bloat)
- **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com/) with curated light/dark CSS custom property tokens (`#F8FAFC` Soft Alabaster & `#0B0F19` Obsidian Navy)
- **State Management & Routing:** React Context API (`AuthContext`, `ThemeContext`, `PreviewContext`) + [React Router DOM v7](https://reactrouter.com/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for client-side input validation
- **Data Visualizations:** [Recharts](https://recharts.org/) (Responsive Area Charts, Bar Charts, and Tooltips)
- **Icons & Polish:** [Lucide React](https://lucide.dev/) (Accessible SVG iconography)
- **Resilience:** Global React `ErrorBoundary` with reload recovery and safe navigation fallbacks

### Backend Architecture
- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+ / v20+ LTS)
- **Web Framework:** [Express.js](https://expressjs.com/) (RESTful API architecture)
- **Security & Hardening:**
  - In-memory sliding-window IP rate limiters (`authLimiter` and `aiLimiter`)
  - Strict payload size boundaries (`100kb`)
  - Hardened HTTP security headers (`nosniff`, `DENY`, referrer policies)
  - Strict CORS origin whitelisting
- **Authentication & Encryption:** [JSON Web Tokens (JWT)](https://jwt.io/) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing with adaptive cost factor (10 rounds)

### Database Layer
- **Database Engine:** [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud Document Database)
- **Object Data Modeling (ODM):** [Mongoose](https://mongoosejs.com/) (Strict schema definitions, virtual properties, document validation, and aggregation pipelines)

### AI Engine Layer
- **Inference Provider:** [Groq Cloud](https://groq.com/)
- **Large Language Model:** `llama-3.3-70b-versatile`
- **Integration:** Server-side only via `@groq/groq-sdk` with markdown-fencing sanitization, retry backoff, and JSON parsing fallbacks

---

## 3. System Architecture & Folder Structure

```text
career-ai/
├── client/                               # Frontend React 19 Application
│   ├── public/                           # Favicons and static public assets
│   ├── src/
│   │   ├── components/                   # Reusable UI components
│   │   │   ├── layout/                   # AppLayout (Sidebar/Mobile Drawer), Navbar
│   │   │   ├── ui/                       # ThemeToggle, Skeleton loaders, PreviewToolbar
│   │   │   ├── ErrorBoundary.jsx         # Global error fallback card
│   │   │   └── ProtectedRoute.jsx        # JWT route guard
│   │   ├── context/                      # React context providers (AuthContext, ThemeContext)
│   │   ├── pages/                        # 10 core pages (Landing, Login, Register, Dashboard,
│   │   │                                 # Configure, ActiveSession, Report, History, Analytics, Settings)
│   │   ├── services/                     # Axios API instance with timeout safeguards & preview data
│   │   ├── styles/                       # index.css (Tailwind directives, CSS variables, reduced motion)
│   │   ├── App.jsx                       # Route registry and application layout tree
│   │   └── main.jsx                      # React 19 entry point wrapped in ErrorBoundary
│   ├── index.html                        # HTML entry point with title and meta tags
│   ├── tailwind.config.js                # Custom color tokens, font configurations
│   ├── vite.config.js                    # Vite dev server and build configuration
│   └── package.json                      # Client dependencies
│
├── server/                               # Backend Node.js / Express API
│   ├── middleware/                       # Rate limiting, auth verification, error handler
│   │   ├── authMiddleware.js             # Bearer JWT verification and user injection
│   │   ├── errorMiddleware.js            # Standardized JSON error response handler
│   │   └── rateLimitMiddleware.js        # In-memory IP window rate limiters (Auth & AI)
│   ├── models/                           # Mongoose data models
│   │   ├── User.js                       # User credentials, profile, and timestamps
│   │   └── Interview.js                  # Embedded questions subdocument schema
│   ├── routes/                           # Express REST controllers
│   │   ├── analyticsRoutes.js            # Aggregation pipelines for dashboard and charts
│   │   ├── authRoutes.js                 # Register, login, profile updates
│   │   ├── interviewRoutes.js            # Generation, question answering, evaluation
│   │   └── userRoutes.js                 # User profile metadata
│   ├── services/                         # Business logic and external APIs
│   │   ├── evaluationService.js          # 100-pt rubric validation, clamping, and scoring
│   │   └── groqService.js                # Groq API question generation & evaluation prompts
│   ├── server.js                         # Server entry point, DB connection, CORS, headers
│   └── package.json                      # Server dependencies
│
├── .gitignore                            # Root gitignore protecting .env and node_modules
├── package.json                          # Root runner scripts (concurrently)
└── README.md                             # Authoritative project documentation
```

### 3.1 Why Embedded Subdocuments (`Interview.questions[]`)?
In `server/models/Interview.js`, questions are embedded directly as subdocuments inside the parent `Interview` document rather than normalized into a separate `Question` collection:

1. **Transactional Atomicity & Zero Joins:** When a candidate loads an active interview or views a completed evaluation report, the server executes a single indexed query (`Interview.findById(id)`). This eliminates costly `$lookup` join operations in MongoDB.
2. **Historical Immutability:** If system question generation templates evolve in the future, a candidate's completed interview remains permanently frozen exactly as it was administered and scored.
3. **Data Lifecycle Alignment:** Questions and their corresponding evaluations have zero independent lifecycle outside of their parent interview session. Deleting or archiving an interview automatically cascades to all its embedded questions with zero orphan records.

---

## 4. The 100-Point Weighted Evaluation Rubric

Every candidate answer is evaluated across 4 objective criteria totaling **100 maximum points**:

| Criterion | Max Points | Weight | What is Evaluated |
| :--- | :---: | :---: | :--- |
| **Technical Accuracy** | **40** | 40% | Correctness of concepts, algorithms, frameworks, edge-case awareness, and architectural trade-offs. |
| **Relevance to Prompt** | **25** | 25% | Direct alignment with the question asked without rambling, evasiveness, or off-topic filler. |
| **Clarity & Communication** | **20** | 20% | Structured explanation (e.g., STAR technique), professional vocabulary, and coherent conciseness. |
| **Completeness** | **15** | 15% | Thorough coverage including real-world examples, impact measurement, and logical conclusion. |

### 4.1 Independent Backend Calculation & Safeguards
AI models can hallucinate incorrect totals or invalid subscores. Career AI enforces a strict multi-layer mathematical validation process inside `server/services/evaluationService.js`:

```javascript
// Step 1: Clamp every sub-score within its strict rubric ceiling
const technical = Math.min(40, Math.max(0, Math.round(rawScore.technical || 0)));
const relevance = Math.min(25, Math.max(0, Math.round(rawScore.relevance || 0)));
const clarity = Math.min(20, Math.max(0, Math.round(rawScore.clarity || 0)));
const completeness = Math.min(15, Math.max(0, Math.round(rawScore.completeness || 0)));

// Step 2: Recalculate the question score authoritatively on the backend
const questionScore = technical + relevance + clarity + completeness; // Max 100

// Step 3: Compute the overall interview score as the rounded mean of all questions
const overallScore = Math.round(questions.reduce((sum, q) => sum + q.score, 0) / questions.length);
```

---

## 5. Step-by-Step Local Installation & Setup

### 5.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB Atlas:** Free cluster or local MongoDB instance (`mongodb://localhost:27017/career_ai`)
- **Groq Cloud API Key:** Free API key from [https://console.groq.com/keys](https://console.groq.com/keys)

### 5.2 Environment Variables Setup

#### 1. Server Environment (`server/.env`)
Create a `.env` file in the `server/` directory:
```env
# Server Network Port & Environment
PORT=5000
NODE_ENV=development

# Client Origin for CORS
CLIENT_URL=http://localhost:5173

# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/career_ai?retryWrites=true&w=majority

# JWT Authentication Secret & Lifetime
JWT_SECRET=super_secret_jwt_key_career_ai_v1_change_in_production
JWT_EXPIRES_IN=7d

# Groq AI Service Configuration (Server-Side Only)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

#### 2. Client Environment (`client/.env`)
Create a `.env` file in the `client/` directory:
```env
# API Endpoint for Axios Client
VITE_API_URL=http://localhost:5000/api
```

### 5.3 Installation & Execution Commands

```bash
# 1. Clone repository and navigate to root
cd career-ai

# 2. Install dependencies for root, server, and client
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 3. Run both backend and frontend concurrently
npm run dev
```

- **Frontend Client:** Available at `http://localhost:5173`
- **Backend API:** Available at `http://localhost:5000`
- **API Health Check:** `http://localhost:5000/api/health`

---

## 6. Complete API Endpoints Reference

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/health` | Public | None | Server uptime, environment, and DB status |
| `POST` | `/api/auth/register` | Public | 20 / 15 min | Register new user account with hashed password |
| `POST` | `/api/auth/login` | Public | 20 / 15 min | Authenticate user and return signed JWT |
| `GET` | `/api/auth/me` | JWT | None | Verify active token and return user profile |
| `PATCH`| `/api/users/profile` | JWT | None | Update user display name and profile settings |
| `POST` | `/api/interviews` | JWT | 15 / 10 min | Generate and persist questions using Groq AI |
| `GET` | `/api/interviews` | JWT | None | List user's interview sessions with search & filters |
| `GET` | `/api/interviews/:id` | JWT | None | Fetch single interview session and question details |
| `POST` | `/api/interviews/:id/answers`| JWT | None | Save or update draft answer for a specific question |
| `POST` | `/api/interviews/:id/evaluate`| JWT | 15 / 10 min | Submit interview answers for 100-pt AI evaluation |
| `GET` | `/api/analytics/dashboard`| JWT | None | Aggregate KPIs, recent interviews, score trends |
| `GET` | `/api/analytics/performance`| JWT | None | 4-criterion mastery, category breakdown, weak topics |

---

## 7. College Viva / Presentation Quick-Reference Guide

The following 8 questions and answers cover the core engineering concepts, design decisions, and architectural rationales of Career AI for academic presentations and technical viva examinations:

### Q1: Why did you choose JWT authentication over traditional server-side session cookies?
**Answer:**
> "JWT (JSON Web Token) authentication is **stateless**. Instead of storing session records in server memory or a Redis cache and performing database lookups on every single HTTP request, the client stores a cryptographically signed token. The server verifies the token signature locally using `JWT_SECRET` in `authMiddleware.js`. This reduces database I/O, allows the backend to scale horizontally without sticky sessions, and works seamlessly with decoupled Single Page Applications (SPAs)."

### Q2: How does `bcryptjs` protect user passwords against brute force and rainbow table attacks?
**Answer:**
> "Passwords are never stored in plaintext. In `server/models/User.js`, a Mongoose pre-save hook automatically intercepts password creation or changes. It generates a cryptographically random **salt** with a cost factor of 10 rounds (`bcrypt.genSalt(10)`) and computes a one-way hash (`bcrypt.hash(password, salt)`). The salt prevents pre-computed rainbow table attacks, and the adaptive cost factor deliberately slows down brute-force and dictionary attacks."

### Q3: How does the backend prevent Groq AI hallucinated scores or malformed JSON from crashing the server?
**Answer:**
> "We implement a defensive multi-layer validation pipeline in `server/services/evaluationService.js` and `groqService.js`:
> 1. The AI prompt enforces JSON-only output with explicit schema keys.
> 2. The parser cleans out any markdown wrapping (` ```json ` fences) before parsing.
> 3. If parsing fails, an exponential retry backoff attempts re-generation.
> 4. Crucially, the backend does **not** trust the AI's total score. It clamps every sub-score within its mathematical ceiling (`Math.min(max, Math.max(0, subScore))`) and recalculates the total score independently using server-side arithmetic."

### Q4: Why use an embedded `questions[]` array in MongoDB instead of a separate `Question` collection?
**Answer:**
> "In MongoDB, document modeling follows the **'data that is accessed together should be stored together'** principle:
> 1. An interview and its questions are always fetched and displayed together. Embedding eliminates expensive `$lookup` (SQL-style JOIN) queries.
> 2. It ensures atomic writes: saving an interview or updating answers is an atomic operation within a single document.
> 3. It preserves historical data immutability: if future question prompt templates change, a candidate's past interview session remains permanently intact."

### Q5: How does the Light/Dark theme system toggle and persist without page-load flickering?
**Answer:**
> "In `client/src/context/ThemeContext.jsx` and `index.css`:
> 1. The user's choice is saved in `localStorage.getItem('career_ai_theme')` with a fallback to `window.matchMedia('(prefers-color-scheme: dark)')`.
> 2. On load, the theme provider synchronously adds or removes the `.dark` class on the root `<html>` element.
> 3. Tailwind is configured with `darkMode: 'class'`, and all styling uses semantic CSS custom properties (`--app-bg`, `--app-card`, `--app-text-primary`) that instantly update without re-rendering or component flashes."

### Q6: How does the application prevent malicious users or bots from exhausting the Groq AI API quota?
**Answer:**
> "In `server/middleware/rateLimitMiddleware.js`, we implemented two custom zero-dependency in-memory sliding-window IP rate limiters:
> - `authLimiter`: Limits `/api/auth/login` and `/api/auth/register` to 20 requests per 15 minutes, preventing credential stuffing.
> - `aiLimiter`: Limits `POST /api/interviews` and `POST /api/interviews/:id/evaluate` to 15 requests per 10 minutes.
> If an IP exceeds the threshold, the middleware immediately rejects the request with HTTP `429 Too Many Requests` and standard `Retry-After` headers, protecting the Groq API key and keeping operational costs zero."

### Q7: What state machine governs the lifecycle of an interview session?
**Answer:**
> "The interview lifecycle transitions through 4 deterministic statuses:
> 1. `pending`: Interview created with AI-generated questions, but candidate has not yet submitted an answer.
> 2. `in-progress`: Candidate is answering questions; draft answers are saved dynamically via `POST /api/interviews/:id/answers`.
> 3. `completed`: Candidate submitted responses, and the AI evaluation service successfully generated the 100-point rubric breakdown and model answers.
> 4. `failed`: If the AI provider times out or errors during evaluation, the state transitions to `failed`, allowing the user to click 'Retry Evaluation' without losing their submitted answers."

### Q8: How does the React frontend maintain high resilience and avoid the 'white screen of death'?
**Answer:**
> "We implemented three defensive frontend patterns:
> 1. **React `ErrorBoundary` (`client/src/components/ErrorBoundary.jsx`):** Wraps the entire application in `main.jsx` to catch any unhandled JavaScript render exceptions and display a recovery card with 'Reload Application' and 'Back to Dashboard' buttons.
> 2. **Network Timeout Safeguard (`client/src/services/api.js`):** Axios has an enforced timeout (6,000ms default; 60,000ms for AI evaluation) so requests cannot hang indefinitely.
> 3. **Non-blocking Auth Verification (`AuthContext.jsx`):** A fallback safety timer guarantees the initial loading spinner dismisses even if the backend is slow or restarting."

---

## 8. License & Academic Attribution
Developed as an advanced MERN stack engineering project strictly adhering to the Career AI Product Requirements Document (`career-ai PRD.md`). Built for educational, demonstration, and viva presentation purposes.
