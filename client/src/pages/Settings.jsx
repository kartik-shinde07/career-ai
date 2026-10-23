// imports for react react-router lucide icons form validation and auth context below this code block
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Mail,
  Calendar,
  Sun,
  Moon,
  LogOut,
  Save,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { PREVIEW_USER } from '../services/previewData';

// zod schema for user profile name update below this code block
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters long')
    .max(60, 'Display name cannot exceed 60 characters')
});

// profile and settings page component below this code block (PROF-001 to PROF-003)
export const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, updateUserProfile, logoutUser } = useAuth();

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  // current user values with fallback to preview data below this code block
  const currentName = user?.name || PREVIEW_USER.name;
  const currentEmail = user?.email || PREVIEW_USER.email;
  const formattedJoinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : PREVIEW_USER.joinedDate;

  // react hook form for profile name management below this code block
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentName
    }
  });

  // reset form value when user data loads or changes below this code block
  useEffect(() => {
    if (user?.name) {
      reset({ name: user.name });
    }
  }, [user, reset]);

  // handle profile update submit to backend api below this code block (PROF-002)
  const onSubmit = async (data) => {
    setUpdateSuccess(false);
    setUpdateError('');

    try {
      const result = await updateUserProfile({ name: data.name });
      if (result.success) {
        setUpdateSuccess(true);
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        setUpdateError(result.message || 'Failed to update profile name.');
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update display name. Please try again.');
    }
  };

  // handle theme switch and backend synchronization below this code block (PROF-003)
  const handleThemeChange = async (newTheme) => {
    // switch local theme immediately for zero lag UI experience below this code block
    setTheme(newTheme);

    // persist theme preference to backend user document if authenticated below this code block
    if (user) {
      setIsUpdatingTheme(true);
      try {
        await updateUserProfile({ themePreference: newTheme });
      } catch (err) {
        console.warn('[Settings] Failed to persist theme preference to backend:', err);
      } finally {
        setIsUpdatingTheme(false);
      }
    }
  };

  // handle user logout below this code block (AUTH-005)
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* page header below this code block */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-app-accent-subtle text-app-accent text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Account Preferences • Section 25</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Preferences</h1>
        <p className="mt-1 text-xs sm:text-sm text-app-text-muted">
          Manage your account credentials, target profile information, and global visual appearance.
        </p>
      </div>

      {/* personal profile information card below this code block (PROF-001) */}
      <div className="card-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-app-border">
          <User className="w-5 h-5 text-app-accent" />
          <h2 className="text-base font-bold tracking-tight">Personal Profile</h2>
        </div>

        {/* success notification banner below this code block */}
        {updateSuccess && (
          <div className="p-3.5 rounded-lg bg-status-strong/10 border border-status-strong/20 text-status-strong text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Display name updated successfully!</span>
          </div>
        )}

        {/* error notification banner below this code block */}
        {updateError && (
          <div className="p-3.5 rounded-lg bg-status-weak/10 border border-status-weak/20 text-status-weak text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{updateError}</span>
          </div>
        )}

        {/* display name form with react hook form and zod validation below this code block */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* display name input */}
          <div>
            <label className="block text-xs font-semibold text-app-text-muted mb-1.5" htmlFor="settings-name">
              Full Display Name (2–60 chars)
            </label>
            <input
              id="settings-name"
              type="text"
              {...register('name')}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-app-card text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors ${
                errors.name ? 'border-status-weak focus:ring-status-weak' : 'border-app-border'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-status-weak mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          {/* read-only email metadata below this code block (PROF-001) */}
          <div>
            <label className="block text-xs font-semibold text-app-text-muted mb-1.5">
              Email Address (Read-Only)
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-app-border bg-app-muted/50 text-app-text-muted text-sm font-sans">
              <Mail className="w-4 h-4 shrink-0" />
              <span>{currentEmail}</span>
            </div>
            <p className="text-[11px] text-app-text-muted mt-1">
              Protected by server-side authentication and JWT identity verification.
            </p>
          </div>

          {/* read-only member since metadata below this code block (PROF-001) */}
          <div>
            <label className="block text-xs font-semibold text-app-text-muted mb-1.5">
              Account Registration Date
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-app-border bg-app-muted/50 text-app-text-muted text-sm">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{formattedJoinedDate}</span>
            </div>
          </div>

          {/* save profile submit button below this code block */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2 px-5 shadow-sm font-semibold flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* visual appearance & theme card below this code block (PROF-003, THEME-001 to THEME-003) */}
      <div className="card-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-app-border">
          <Sparkles className="w-5 h-5 text-app-accent" />
          <h2 className="text-base font-bold tracking-tight">Appearance & Theme</h2>
        </div>

        <p className="text-xs text-app-text-muted leading-relaxed">
          Select your global visual theme. Background surfaces, cards, borders, typography, form controls, and Recharts visualizations instantly adapt.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* light theme selector card */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            aria-label="Activate Light Mode"
            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
              theme === 'light'
                ? 'border-app-accent bg-app-accent-subtle shadow-md ring-2 ring-app-accent/20'
                : 'border-app-border hover:border-app-text-muted/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Light Mode</h4>
                <p className="text-[11px] text-app-text-muted">Soft Alabaster (#F8FAFC)</p>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-app-accent shrink-0" />}
          </button>

          {/* dark theme selector card */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            aria-label="Activate Dark Mode"
            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
              theme === 'dark'
                ? 'border-app-accent bg-app-accent-subtle shadow-md ring-2 ring-app-accent/20'
                : 'border-app-border hover:border-app-text-muted/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Dark Mode</h4>
                <p className="text-[11px] text-app-text-muted">Obsidian Navy (#0B0F19)</p>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-app-accent shrink-0" />}
          </button>

        </div>
      </div>

      {/* account sign out card below this code block (AUTH-005) */}
      <div className="card-surface p-6 sm:p-8 space-y-4 border-status-weak/20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-status-weak">Session Sign Out</h2>
            <p className="text-xs text-app-text-muted mt-0.5">
              End your active browser session and purge stored authentication credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline text-status-weak border-status-weak/30 hover:bg-status-weak/10 text-xs py-2 px-5 inline-flex items-center justify-center gap-2 font-semibold shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

    </div>
  );
};

// default export below this code block
export default Settings;
