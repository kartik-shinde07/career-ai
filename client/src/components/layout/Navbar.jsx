// imports for react react-router and icons below this code block
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, User } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

// public navigation header component below this code block
export const Navbar = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* brand logo and name below this code block */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-app-accent flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Career<span className="text-app-accent">AI</span>
              </span>
              <span className="badge badge-primary py-0.5 px-2 text-[10px]">
                v1.0
              </span>
            </div>
          </div>
        </Link>

        {/* right side action links and theme toggle below this code block */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          {location.pathname !== '/login' && (
            <Link
              to="/login"
              className="text-sm font-medium text-app-text-muted hover:text-app-text-primary px-3 py-2 rounded-lg transition-colors"
            >
              Log In
            </Link>
          )}

          {location.pathname !== '/register' ? (
            <Link
              to="/register"
              className="btn-primary text-sm py-2 px-4 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-sm py-2 px-4 shadow-sm"
            >
              <span>Sign In</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
