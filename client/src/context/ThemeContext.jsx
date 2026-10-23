// imports for react hooks below this code block
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// local storage theme key definition below this code block
export const THEME_STORAGE_KEY = 'career_ai_theme';

// theme context creation below this code block
const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {}
});

// safe local storage getter helper below this code block
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Check system preference if no saved theme
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    // Fallback safely if localStorage is blocked or throws
    console.warn('[ThemeContext] localStorage access denied or unavailable, defaulting to dark theme:', error);
  }
  return 'dark';
};

// theme context provider below this code block
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  // effect to apply theme class and color-scheme to html root and persist to storage below this code block
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('[ThemeContext] Unable to persist theme to localStorage:', error);
    }
  }, [theme]);

  // theme setter function memoized with useCallback below this code block
  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  // theme toggle function memoized with useCallback below this code block
  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// custom useTheme hook export below this code block
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// default export below this code block
export default ThemeContext;
