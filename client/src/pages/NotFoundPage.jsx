// imports for react react-router and lucide icons below this code block
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

// 404 page not found component below this code block
export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary flex items-center justify-center p-4">
      <div className="card-surface p-8 max-w-md w-full text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-app-accent/10 text-app-accent flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold font-mono text-app-accent">404</h1>
        <h2 className="text-xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-xs text-app-text-muted leading-relaxed">
          The view you requested does not exist or has been moved to another route.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary text-xs py-2 px-4">
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link to="/" className="btn-outline text-xs py-2 px-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
