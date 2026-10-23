// imports for react react-router lucide icons and auth context below this code block
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

// navigation link items definition below this code block
const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'New Interview', path: '/interview/new', icon: PlusCircle },
  { name: 'Interview History', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Profile & Settings', path: '/settings', icon: Settings },
];

// helper function to generate user initials from display name below this code block
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// authenticated application shell component below this code block
export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  // compute dynamic user display properties below this code block
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initials = getInitials(displayName);

  // close mobile drawer on route change below this code block
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // handle user logout and redirect to login below this code block (AUTH-005)
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
      
      {/* desktop sidebar navigation below this code block */}
      <aside className="hidden lg:flex flex-col w-[250px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] fixed inset-y-0 left-0 z-30 transition-colors duration-200">
        
        {/* sidebar brand header below this code block */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-app-accent flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Career<span className="text-app-accent">AI</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* sidebar navigation links list below this code block */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: navActive }) => {
                  const active = navActive || isActive;
                  return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                    active
                      ? 'bg-app-accent/10 text-app-accent font-semibold border-l-4 border-app-accent pl-2.5'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`;
                }}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-app-accent' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-app-accent opacity-70" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* sidebar user profile and logout card with live user data below this code block (AUTH-005) */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-app-accent/15 text-app-accent flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-status-weak hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* mobile sticky top header below this code block */}
      <header className="lg:hidden sticky top-0 z-40 w-full h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation drawer"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-accent flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-app-text-primary">
              Career<span className="text-app-accent">AI</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-7 h-7 rounded-full bg-app-accent/20 text-app-accent flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* mobile slide-out drawer menu below this code block */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-4 z-10 shadow-2xl transition-transform">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-app-accent flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  Career<span className="text-app-accent">AI</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation drawer"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-app-accent/15 text-app-accent font-semibold border-l-4 border-app-accent pl-2'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full bg-app-accent/20 text-app-accent flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-status-weak"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* main application content area below this code block */}
      <main className="flex-1 lg:pl-[250px] flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};
