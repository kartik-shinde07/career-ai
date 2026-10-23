// imports for react react-router lucide icons and form validation below this code block
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Eye, EyeOff, ArrowRight, User, Mail, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

// zod validation schema for new user registration below this code block
const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// new user registration page component below this code block
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // react hook form initialization with zod validation resolver below this code block
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // handle registration form submit with backend api integration below this code block (AUTH-001, AUTH-002)
  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      // dispatch registration request through auth context to express backend below this code block
      const result = await registerUser(data.name, data.email, data.password);

      if (result.success) {
        // navigate to dashboard upon successful account creation and jwt issuance below this code block
        navigate('/dashboard');
      } else {
        setServerError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      // handle duplicate email 409 error or server validation failures below this code block
      if (err.response?.status === 409) {
        setServerError(err.response.data?.message || 'An account with this email already exists.');
      } else if (err.response?.status === 503) {
        setServerError(err.response.data?.message || 'Database service unavailable. Please ensure MongoDB is running.');
      } else {
        setServerError(err.response?.data?.message || 'Registration failed. Please check your information.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* public navigation header below this code block */}
      <Navbar />

      {/* register card container below this code block */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md card-surface bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 p-8 shadow-xl border">
          
          {/* card header below this code block */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-app-accent flex items-center justify-center text-white mx-auto mb-3 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create Your Account</h1>
            <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
              Start practicing mock interviews with structured 100-point AI feedback
            </p>
          </div>

          {/* error alert banner below this code block */}
          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-status-weak/10 border border-status-weak/20 text-status-weak text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* registration form with zod validation below this code block */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* full name input below this code block */}
            <div>
              <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="reg-name">
                Full Name (2–60 chars)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-name"
                  type="text"
                  {...register('name')}
                  placeholder="Aarav Sharma"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                    errors.name ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-status-weak mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            {/* email address input below this code block */}
            <div>
              <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  {...register('email')}
                  placeholder="aarav@example.com"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                    errors.email ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-status-weak mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* password input with show/hide toggle below this code block */}
            <div>
              <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="reg-password">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                    errors.password ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-status-weak mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* confirm password input below this code block */}
            <div>
              <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                    errors.confirmPassword ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-status-weak mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.confirmPassword.message}</span>
                </p>
              )}
            </div>

            {/* submit button with loading state below this code block */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-semibold mt-2 shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* navigation link to login page below this code block */}
          <div className="mt-6 text-center text-xs text-app-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-app-accent font-semibold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};
