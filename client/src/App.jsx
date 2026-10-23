// imports for react react-router providers and layout components below this code block
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PreviewProvider } from './context/PreviewContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// page component imports below this code block
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { ConfigureInterview } from './pages/ConfigureInterview';
import { ActiveInterview } from './pages/ActiveInterview';
import { InterviewReport } from './pages/InterviewReport';
import { InterviewHistory } from './pages/InterviewHistory';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { NotFoundPage } from './pages/NotFoundPage';

// main application routing component below this code block
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PreviewProvider>
          <BrowserRouter>
            <Routes>
              {/* public landing page route below this code block */}
              <Route path="/" element={<LandingPage />} />

              {/* public-only auth routes redirecting authenticated users to dashboard below this code block */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />

              {/* protected authenticated application routes wrapped in app shell below this code block (AUTH-006) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/interview/new" element={<ConfigureInterview />} />
                <Route path="/interview/:id/session" element={<ActiveInterview />} />
                <Route path="/interview/:id/report" element={<InterviewReport />} />
                <Route path="/history" element={<InterviewHistory />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* 404 catch-all fallback route below this code block */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </PreviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// default export below this code block
export default App;
