// imports for react react-router form validation and lucide icons below this code block
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Layers,
  GraduationCap,
  Flame,
  HelpCircle,
  Code2,
  Users2,
  Smile,
  Check,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Info
} from 'lucide-react';
import api from '../services/api';

// popular role chips for quick selection below this code block
const QUICK_ROLES = [
  'Full Stack MERN Developer',
  'Frontend Developer (React)',
  'Backend Developer (Node.js)',
  'BCA Software Trainee',
  'Junior Software Engineer',
  'Data Analyst Trainee'
];

// experience levels definition below this code block
const EXPERIENCE_LEVELS = [
  { id: 'Fresher', label: 'Student / Fresher', desc: 'No industry experience, academic projects only' },
  { id: 'Entry-level', label: 'Entry-Level (0–2 yrs)', desc: '1–2 years junior engineering experience' },
  { id: 'Experienced', label: 'Experienced (2+ yrs)', desc: 'Professional architecture and system ownership' }
];

// interview categories definition below this code block
const CATEGORIES = [
  { id: 'Technical', label: 'Technical', icon: Code2, desc: 'CS fundamentals, code concepts, APIs' },
  { id: 'Behavioral', label: 'Behavioral', icon: Smile, desc: 'Situational & STAR method questions' },
  { id: 'HR', label: 'HR & Culture', icon: Users2, desc: 'Expectations, workplace culture, fit' },
  { id: 'Role-based', label: 'Role-based', icon: Briefcase, desc: 'Real-world day-to-day role scenarios' }
];

// difficulty levels definition below this code block
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

// question counts definition below this code block
const QUESTION_COUNTS = [5, 10, 15];

// zod validation schema for interview setup form below this code block (INT-001)
const interviewConfigSchema = z.object({
  targetRole: z
    .string()
    .trim()
    .min(2, 'Target job role must be at least 2 characters')
    .max(80, 'Target job role cannot exceed 80 characters')
    .refine((val) => /[a-zA-Z]/.test(val), {
      message: 'Target job role must contain alphabetic characters'
    }),
  experienceLevel: z.enum(['Fresher', 'Entry-level', 'Experienced']),
  category: z.enum(['Technical', 'Behavioral', 'HR', 'Role-based']),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  questionCount: z.number().int().refine((val) => [5, 10, 15].includes(val), {
    message: 'Question count must be 5, 10, or 15'
  })
});

// configure interview page component below this code block
export const ConfigureInterview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // pre-fill category if provided in query param below this code block
  const initialCategory = searchParams.get('category') || 'Technical';

  // react hook form initialization with zod validation resolver below this code block
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(interviewConfigSchema),
    defaultValues: {
      targetRole: 'Full Stack MERN Developer',
      experienceLevel: 'Fresher',
      category: ['Technical', 'Behavioral', 'HR', 'Role-based'].includes(initialCategory)
        ? initialCategory
        : 'Technical',
      difficulty: 'Intermediate',
      questionCount: 5
    }
  });

  // watch form values for live configuration summary card below this code block
  const formValues = watch();

  // update category when query param changes below this code block
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && ['Technical', 'Behavioral', 'HR', 'Role-based'].includes(cat)) {
      setValue('category', cat);
    }
  }, [searchParams, setValue]);

  // handle interview generation submit via live backend api below this code block (INT-001 to INT-003, AI-001)
  const onSubmit = async (data) => {
    setGenerationError('');
    setIsGenerating(true);

    try {
      // dispatch interview creation request with groq ai generation to backend with extended 60s timeout below this code block
      const response = await api.post(
        '/interviews',
        {
          targetRole: data.targetRole.trim(),
          experienceLevel: data.experienceLevel,
          category: data.category,
          difficulty: data.difficulty,
          questionCount: Number(data.questionCount)
        },
        { timeout: 60000 }
      );

      if (response.data?.success && response.data?.interview?._id) {
        const interviewId = response.data.interview._id;
        // navigate to active interview workspace with created interview id below this code block
        navigate(`/interview/${interviewId}/session`);
      } else {
        setGenerationError(response.data?.message || 'Failed to generate interview questions. Please try again.');
      }
    } catch (err) {
      // capture and display backend groq generation errors while preserving form inputs below this code block (ERR-002, INT-003)
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Could not generate interview questions right now. The AI service encountered an issue. Please retry.';
      setGenerationError(serverMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* page header below this code block */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-app-accent-subtle text-app-accent text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Generation Setup • Section 18</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configure Your Mock Interview</h1>
        <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
          Configure your target role parameters. Groq AI generates role-specific interview questions on demand.
        </p>
      </div>

      {/* recoverable error banner with retry trigger below this code block (INT-003, ERR-002) */}
      {generationError && (
        <div className="p-4 rounded-xl bg-status-weak/10 border border-status-weak/30 text-status-weak flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{generationError}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isGenerating}
            className="btn-outline text-status-weak border-status-weak/30 hover:bg-status-weak/10 text-xs py-1.5 px-3 self-end sm:self-auto shrink-0 flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Generation</span>
          </button>
        </div>
      )}

      {/* main configuration grid with form and live summary sidebar below this code block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* left column form controls (8 cols) below this code block */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-8 space-y-6">
          
          {/* 1. target job role input and quick-select chips below this code block (INT-001) */}
          <div className="card-surface p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="targetRole" className="flex items-center gap-2 text-sm font-semibold text-app-text-primary">
                <Briefcase className="w-4 h-4 text-app-accent" />
                <span>1. Target Job Role</span>
              </label>
              <span className="text-[11px] text-app-text-muted">2–80 characters</span>
            </div>

            <div>
              <input
                id="targetRole"
                type="text"
                {...register('targetRole')}
                placeholder="e.g. Full Stack MERN Developer, React Frontend Engineer..."
                className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                  errors.targetRole ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
                }`}
              />
              {errors.targetRole && (
                <p className="text-[11px] text-status-weak mt-1 font-medium">
                  {errors.targetRole.message}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] text-app-text-muted mb-2 font-medium">Quick Select Chips:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ROLES.map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setValue('targetRole', role, { shouldValidate: true })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      formValues.targetRole === role
                        ? 'border-app-accent bg-app-accent/15 text-app-accent font-semibold shadow-xs'
                        : 'border-app-border text-app-text-muted hover:border-app-text-muted hover:text-app-text-primary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. experience level selector below this code block (INT-001) */}
          <div className="card-surface p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text-primary">
              <GraduationCap className="w-4 h-4 text-app-accent" />
              <span>2. Experience Level</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = formValues.experienceLevel === lvl.id;
                return (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setValue('experienceLevel', lvl.id, { shouldValidate: true })}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-app-accent bg-app-accent-subtle shadow-xs'
                        : 'border-app-border hover:border-app-text-muted/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-app-accent text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                    <h4 className="font-semibold text-sm mb-1">{lvl.label}</h4>
                    <p className="text-xs text-app-text-muted leading-relaxed">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. interview category selector below this code block (INT-001) */}
          <div className="card-surface p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text-primary">
              <Layers className="w-4 h-4 text-app-accent" />
              <span>3. Interview Category</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formValues.category === cat.id;

                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setValue('category', cat.id, { shouldValidate: true })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-app-accent bg-app-accent-subtle shadow-xs'
                        : 'border-app-border hover:border-app-text-muted/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-app-accent' : 'text-app-text-muted'}`} />
                    <h4 className="font-semibold text-sm">{cat.label}</h4>
                    <p className="text-[11px] text-app-text-muted mt-1 leading-snug">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. difficulty and 5. question count row below this code block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* difficulty selector */}
            <div className="card-surface p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-app-text-primary">
                <Flame className="w-4 h-4 text-app-accent" />
                <span>4. Difficulty Tier</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((diff) => {
                  const isSelected = formValues.difficulty === diff;
                  return (
                    <button
                      type="button"
                      key={diff}
                      onClick={() => setValue('difficulty', diff, { shouldValidate: true })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-app-accent bg-app-accent text-white shadow-xs'
                          : 'border-app-border text-app-text-muted hover:border-app-text-muted'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* question count selector */}
            <div className="card-surface p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-app-text-primary">
                <HelpCircle className="w-4 h-4 text-app-accent" />
                <span>5. Question Count</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QUESTION_COUNTS.map((count) => {
                  const isSelected = formValues.questionCount === count;
                  return (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setValue('questionCount', count, { shouldValidate: true })}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-app-accent bg-app-accent text-white shadow-xs'
                          : 'border-app-border text-app-text-muted hover:border-app-text-muted'
                      }`}
                    >
                      {count} Questions
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* submit action button with loading spinner state below this code block (INT-002) */}
          <button
            type="submit"
            disabled={isGenerating}
            className="btn-primary w-full py-3.5 px-6 text-sm font-semibold shadow-md flex items-center justify-center gap-2.5 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating your tailored questions with Groq AI...</span>
              </>
            ) : (
              <>
                <span>Generate Interview Questions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* right column live configuration summary card (4 cols) below this code block */}
        <div className="lg:col-span-4 card-surface p-6 space-y-5 sticky top-24 shadow-sm border-t-4 border-t-app-accent">
          <div className="flex items-center gap-2 pb-3 border-b border-app-border">
            <Info className="w-4 h-4 text-app-accent" />
            <h3 className="font-bold text-sm tracking-tight">Configuration Summary</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[11px] text-app-text-muted font-medium">Target Role</p>
              <p className="font-semibold text-app-text-primary text-sm mt-0.5">
                {formValues.targetRole || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-app-text-muted font-medium">Experience Level</p>
              <span className="badge badge-primary mt-1">{formValues.experienceLevel}</span>
            </div>

            <div>
              <p className="text-[11px] text-app-text-muted font-medium">Track / Category</p>
              <span className="badge badge-moderate mt-1">{formValues.category}</span>
            </div>

            <div>
              <p className="text-[11px] text-app-text-muted font-medium">Difficulty & Length</p>
              <p className="font-semibold text-app-text-primary mt-0.5">
                {formValues.difficulty} • {formValues.questionCount} Questions
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-app-border space-y-2 text-[11px] text-app-text-muted leading-relaxed">
            <div className="flex items-center gap-1.5 text-status-strong font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>100-Point Rubric Enabled</span>
            </div>
            <div className="flex items-center gap-1.5 text-status-strong font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Model Answer Rewrites Included</span>
            </div>
            <div className="flex items-center gap-1.5 text-status-strong font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Draft Preservation Enabled</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// default export below this code block
export default ConfigureInterview;
