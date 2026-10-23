// imports for react react-router lucide icons and form validation below this code block
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

// zod validation schema for user login below this code block
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g. name@example.com)')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
});

// user login page component below this code block
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // redirect target route after successful login below this code block
  const from = location.state?.from?.pathname || '/dashboard';

  // react hook form initialization with zod resolver below this code block
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // handle login form submission with backend api integration below this code block (AUTH-003)
  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      // dispatch login request through auth context to express backend below this code block
      const result = await loginUser(data.email, data.password);

      if (result.success) {
        // navigate to targeted protected page or dashboard below this code block
        navigate(from, { replace: true });
      } else {
        setServerError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      // handle invalid credentials 401 or database 503 errors below this code block
      if (err.response?.status === 401) {
        setServerError('Invalid email or password');
      } else if (err.response?.status === 503) {
        setServerError(err.response.data?.message || 'Database service unavailable. Please ensure MongoDB is running.');
      } else {
        setServerError(err.response?.data?.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* public navigation header below this code block */}
      <Navbar />

      {/* login card container below this code block */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md card-surface bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 p-8 shadow-xl border">
          
          {/* card header and greeting below this code block */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-app-accent flex items-center justify-center text-white mx-auto mb-3 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
              Sign in to your Career AI mock interview workspace
            </p>
          </div>

          {/* generic error alert banner below this code block */}
          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-status-weak/10 border border-status-weak/20 text-status-weak text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* login form inputs with react hook form and zod validation below this code block */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* email address input field below this code block */}
            <div>
              <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  {...register('email')}
                  placeholder="name@example.com"
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

            {/* password input field with show/hide toggle below this code block */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-app-text-muted" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
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

            {/* submit button with loading state below this code block */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-semibold mt-2 shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* navigation link to register page below this code block */}
          <div className="mt-6 text-center text-xs text-app-text-muted">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-app-accent font-semibold hover:underline">
              Create an account
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};
