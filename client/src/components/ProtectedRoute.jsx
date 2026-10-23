// imports for react react-router lucide icons and auth hook below this code block
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// protected route guard component for authenticated application routes below this code block (AUTH-006)
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // display animated loading spinner while session verification is in progress below this code block
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center text-white shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-app-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-app-accent" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // redirect unauthenticated users to login page saving previous location below this code block
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // render protected children or outlet route below this code block
  return children ? children : <Outlet />;
};

// public-only route guard redirecting authenticated users away from auth pages below this code block
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // display loading spinner during initial session check below this code block
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center transition-colors duration-200">
        <Loader2 className="w-6 h-6 animate-spin text-app-accent" />
      </div>
    );
  }

  // redirect authenticated users directly to dashboard below this code block
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // render public children or outlet route below this code block
  return children ? children : <Outlet />;
};

// default export of protected route guard below this code block
export default ProtectedRoute;
