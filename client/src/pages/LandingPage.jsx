// imports for react react-router and lucide icons below this code block
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Brain,
  Target,
  BarChart2,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Code2,
  TrendingUp,
  FileText,
  Clock,
  Compass
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

// interactive 4-criterion rubric details data below this code block
const RUBRIC_CRITERIA = [
  {
    id: 'technical',
    name: 'Technical Accuracy',
    points: 40,
    weight: '40% Weight',
    icon: Target,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    summary: 'Correctness of concepts, frameworks, trade-offs, and domain terminology relevant to the target role.',
    evaluates: [
      'Accurate understanding of language primitives, memory models, and runtime lifecycles',
      'Realistic architectural trade-offs (e.g. SQL normalized schema vs MongoDB BSON flexibility)',
      'Identification of edge cases, write concerns, and algorithmic complexity (Big-O)'
    ]
  },
  {
    id: 'relevance',
    name: 'Relevance to Prompt',
    points: 25,
    weight: '25% Weight',
    icon: Zap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    summary: 'Direct alignment with the interviewer prompt without dodging questions or rambling.',
    evaluates: [
      'Directly addresses all aspects of multi-part technical and behavioral prompts',
      'Avoids filler words, unrelated background trivia, or superficial tangents',
      'Maintains explicit focus on candidate-specific contributions and concrete solutions'
    ]
  },
  {
    id: 'clarity',
    name: 'Clarity & Communication',
    points: 20,
    weight: '20% Weight',
    icon: Brain,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    summary: 'Logical structure (such as the STAR framework), professional terminology, and concise phrasing.',
    evaluates: [
      'Structured thinking (e.g. Situation, Task, Action taken, and quantifiable Result)',
      'Professional engineering vocabulary and articulate syntax',
      'Concise paragraphing that an interviewer can quickly comprehend in under 60 seconds'
    ]
  },
  {
    id: 'completeness',
    name: 'Completeness',
    points: 15,
    weight: '15% Weight',
    icon: Layers,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    summary: 'Thorough coverage including real-world examples, impact measurement, and logical follow-through.',
    evaluates: [
      'Proactive mention of monitoring, testing (unit/integration), and rollback strategies',
      'Tangible business outcomes, performance metrics, and user experience impact',
      'Logical closure without trailing thoughts or unanswered prompt requirements'
    ]
  }
];

// landing page component below this code block
export const LandingPage = () => {
  const [activeCriterion, setActiveCriterion] = useState(RUBRIC_CRITERIA[0]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* public navigation header below this code block */}
      <Navbar />

      {/* modern saas hero section below this code block */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32 border-b border-slate-200 dark:border-slate-800">
        {/* ambient background light gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-app-accent-subtle to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* status badge pill below this code block */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-accent-subtle border border-app-accent/20 text-app-accent text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Career Readiness Platform • MERN + Groq API</span>
          </div>

          {/* hero headline and subtext below this code block */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-app-text-primary max-w-4xl mx-auto leading-tight">
            Master Technical & HR Interviews with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Objective AI Feedback
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-app-text-muted max-w-2xl mx-auto leading-relaxed">
            Practice personalized mock interviews tailored to your exact target role and experience tier. Receive instant 100-point rubric evaluations, strengths, weaknesses, and concrete model answers.
          </p>

          {/* hero call to action buttons below this code block */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="btn-primary w-full sm:w-auto text-base py-3 px-8 shadow-lg shadow-app-accent/25 hover:shadow-app-accent/40"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="btn-outline w-full sm:w-auto text-base py-3 px-8"
            >
              <span>Go to Demo Dashboard</span>
            </Link>
          </div>

          {/* quick highlights strip below this code block */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-app-text-muted">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-strong" />
              <span>100-Point Transparent Rubric</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-strong" />
              <span>Server-Side Groq API Inference</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-strong" />
              <span>Longitudinal Analytics & Tracking</span>
            </div>
          </div>

        </div>
      </section>

      {/* interactive 4-criterion rubric explainer section below this code block */}
      <section className="py-16 md:py-24 border-b border-app-border bg-app-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-accent uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" />
              <span>Grading Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              The 100-Point Weighted Rubric
            </h2>
            <p className="mt-3 text-app-text-muted text-sm sm:text-base">
              Unlike subjective or opaque evaluations, Career AI scores every candidate answer across 4 objective criteria with mathematical verification.
            </p>
          </div>

          {/* rubric selection cards and interactive inspection panel below this code block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* left column 4 criteria cards */}
            <div className="lg:col-span-5 space-y-3">
              {RUBRIC_CRITERIA.map((criterion) => {
                const Icon = criterion.icon;
                const isSelected = activeCriterion.id === criterion.id;

                return (
                  <button
                    key={criterion.id}
                    type="button"
                    onClick={() => setActiveCriterion(criterion)}
                    className={`w-full card-surface p-4 text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-app-accent bg-app-accent-subtle shadow-md'
                        : 'hover:border-app-text-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${criterion.bg} ${criterion.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{criterion.name}</h3>
                        <p className="text-xs text-app-text-muted">{criterion.weight}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-app-accent">
                        {criterion.points}
                      </span>
                      <span className="text-xs text-app-text-muted block">pts max</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* right column active criterion details view */}
            <div className="lg:col-span-7 card-surface p-6 sm:p-8 space-y-6 border-l-4 border-l-app-accent shadow-sm">
              <div className="flex items-center justify-between border-b border-app-border pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${activeCriterion.bg} ${activeCriterion.color}`}>
                    <activeCriterion.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{activeCriterion.name}</h3>
                    <p className="text-xs text-app-text-muted">{activeCriterion.weight} of Total Session Grade</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono text-app-accent">
                    {activeCriterion.points}
                  </span>
                  <span className="text-xs text-app-text-muted block">/ 100 Total Points</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                  Criterion Definition
                </h4>
                <p className="text-sm text-app-text-primary leading-relaxed">
                  {activeCriterion.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-app-text-muted mb-3">
                  What the AI Evaluator Checks
                </h4>
                <ul className="space-y-2.5 text-xs text-app-text-muted">
                  {activeCriterion.evaluates.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-status-strong shrink-0 mt-0.5" />
                      <span className="text-app-text-primary leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-app-muted text-xs text-app-text-muted flex items-center justify-between">
                <span>Total Score Calculation Formula:</span>
                <span className="font-mono font-bold text-app-text-primary">
                  Technical (40) + Relevance (25) + Clarity (20) + Completeness (15) = 100
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* how career ai works 3-step visual workflow below this code block */}
      <section className="py-16 md:py-24 border-b border-app-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              A Structured Preparation Loop in 3 Steps
            </h2>
            <p className="mt-3 text-app-text-muted text-sm sm:text-base">
              Say goodbye to generic static question banks. Practice dynamic, role-aligned interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* step 1 */}
            <div className="card-surface p-6 sm:p-8 relative flex flex-col justify-between">
              <div>
                <span className="w-9 h-9 rounded-xl bg-app-accent text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                  1
                </span>
                <h3 className="text-lg font-bold mb-2">Configure Your Interview</h3>
                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Specify your exact target job role (e.g. MERN Full-Stack, React Frontend, Node.js Backend), experience level, category, difficulty, and question count (`5`, `10`, or `15`).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border text-xs text-app-accent font-semibold flex items-center gap-1">
                <span>Instant Groq AI generation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* step 2 */}
            <div className="card-surface p-6 sm:p-8 relative flex flex-col justify-between">
              <div>
                <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                  2
                </span>
                <h3 className="text-lg font-bold mb-2">Sequential Practice Session</h3>
                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Answer realistic role-based prompts in an active focus workspace with live progress indicators, draft preservation, character counters, and zero-distraction layout.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <span>Real-time draft auto-save</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* step 3 */}
            <div className="card-surface p-6 sm:p-8 relative flex flex-col justify-between">
              <div>
                <span className="w-9 h-9 rounded-xl bg-purple-500 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                  3
                </span>
                <h3 className="text-lg font-bold mb-2">Rubric Evaluation & Model Rewrites</h3>
                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Receive comprehensive criterion-level scoring, highlighted strengths, growth areas, concrete suggested improved answers to study, and longitudinal analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-app-border text-xs text-purple-500 font-semibold flex items-center gap-1">
                <span>Model answers & study topics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* feature bento grid section below this code block */}
      <section className="py-16 md:py-24 border-b border-app-border bg-app-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Engineered for Student Placement Success
            </h2>
            <p className="mt-3 text-app-text-muted text-sm sm:text-base">
              Every feature is built around the real requirements of college campus drives and tech hiring rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* bento item 1 */}
            <div className="card-surface p-6 md:col-span-2 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 text-app-accent flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Dynamic Role-Specific Groq AI Generation</h3>
              <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                Rather than asking generic questions like "Tell me about yourself", Career AI generates tailored scenarios combining your target tech stack, experience level, and interview category in seconds via high-speed Groq LLM inference.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="badge badge-primary">MERN Stack</span>
                <span className="badge badge-primary">React 19</span>
                <span className="badge badge-primary">Node.js Express</span>
                <span className="badge badge-primary">System Design</span>
                <span className="badge badge-primary">Behavioral STAR</span>
              </div>
            </div>

            {/* bento item 2 */}
            <div className="card-surface p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Concrete Answer Rewrites</h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Knowing an answer is weak isn't enough. Every report provides a fully articulated model answer demonstrating how a top candidate would structure the response.
              </p>
            </div>

            {/* bento item 3 */}
            <div className="card-surface p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Longitudinal Progress Charts</h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Track how your technical accuracy, communication clarity, and overall scores progress session-over-session with built-in Recharts visualizations.
              </p>
            </div>

            {/* bento item 4 */}
            <div className="card-surface p-6 md:col-span-2 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Academic Viva Defense & Transparent Architecture</h3>
              <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                Built strictly with pure JavaScript (.js/.jsx), modular REST APIs, and transparent rubric calculation routines that any BCA/MCA student can clearly explain and defend during a college project viva examination.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* footer section below this code block */}
      <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-center text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-app-accent" />
            <span className="font-semibold text-slate-900 dark:text-white">Career AI</span>
            <span>— Mock Interview & Performance Analysis Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">Register</Link>
            <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
