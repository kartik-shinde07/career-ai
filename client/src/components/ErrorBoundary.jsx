// react core class component import below this code block
import React from 'react';

// global error boundary component below this code block
class ErrorBoundary extends React.Component {
  // component constructor initializing error state below this code block
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // static lifecycle method to catch error and update state below this code block
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // lifecycle method for logging caught errors below this code block
  componentDidCatch(error, errorInfo) {
    // secure error logging without exposing sensitive data below this code block
    console.error('ErrorBoundary caught an unhandled application error:', error?.message || error);
    if (errorInfo && errorInfo.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  // handler to reload application below this code block
  handleReload = () => {
    window.location.reload();
  };

  // handler to redirect safely back to dashboard below this code block
  handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  // render fallback ui or children below this code block
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center backdrop-blur-md">
            {/* error icon below this code block */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* title and error explanation below this code block */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              An unexpected application error occurred. You can safely reload the page or navigate back to your dashboard to resume.
            </p>

            {/* action buttons below this code block */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20"
                aria-label="Reload Application"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all border border-slate-200 dark:border-slate-700"
                aria-label="Back to Dashboard"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // normal render when no error occurs below this code block
    return this.props.children;
  }
}

// export error boundary component below this code block
export default ErrorBoundary;
