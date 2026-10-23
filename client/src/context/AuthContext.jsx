// imports for react hooks api service and theme context below this code block
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { TOKEN_STORAGE_KEY, SESSION_EXPIRED_EVENT } from '../services/api';
import { useTheme, THEME_STORAGE_KEY } from './ThemeContext';

// auth context definition with default shape below this code block
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  registerUser: async () => {},
  loginUser: async () => {},
  logoutUser: () => {},
  updateUserProfile: async () => {}
});

// authentication context provider component below this code block
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme } = useTheme();
  const sessionInitializedRef = useRef(false);

  // clear authentication state and remove token from local storage below this code block (AUTH-005)
  const logoutUser = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.warn('[AuthContext] Failed to clear token from localStorage:', error);
    }
    setToken(null);
    setUser(null);
  }, []);

  // initialize user session from stored jwt on application startup with resilient guards below this code block (AUTH-004)
  useEffect(() => {
    let isMounted = true;

    // fallback safety timeout forcing isLoading to false after 3 seconds so user is never locked out below this code block
    const fallbackTimeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);

    // asynchronous token verification routine with guaranteed finally execution below this code block
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');

        if (!storedToken) {
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
          return;
        }

        const response = await api.get('/auth/me');
        if (isMounted && response.data?.success && response.data?.user) {
          const fetchedUser = response.data.user;
          setUser(fetchedUser);
          setToken(storedToken);

          // synchronize user saved theme preference ONLY on startup if no explicit local theme choice exists below this code block
          const activeLocalTheme = localStorage.getItem(THEME_STORAGE_KEY);
          if (!activeLocalTheme && (fetchedUser.themePreference === 'light' || fetchedUser.themePreference === 'dark')) {
            setTheme(fetchedUser.themePreference);
          }
        } else {
          // if response payload is unsuccessful or missing user data immediately clear credentials below this code block
          if (isMounted) {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            } catch (e) {
              console.warn('[AuthContext] Unable to clear token:', e);
            }
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        // if /api/auth/me fails or times out immediately clear token and user state below this code block
        console.warn('[AuthContext] Token verification failed or timed out:', error.message);
        if (isMounted) {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          } catch (e) {
            console.warn('[AuthContext] Failed to remove token from localStorage:', e);
          }
          setToken(null);
          setUser(null);
        }
      } finally {
        // guaranteed to execute to ensure the application never hangs on an infinite loading spinner below this code block
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      restoreSession();
    } else {
      setIsLoading(false);
    }

    // event listener for session expiration triggered by axios interceptor below this code block
    const handleSessionExpired = () => {
      logoutUser();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeoutId);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [logoutUser, setTheme]);

  // register new user function below this code block (AUTH-001, AUTH-002)
  const registerUser = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
      } catch (err) {
        console.warn('[AuthContext] Unable to store token in localStorage:', err);
      }
      setToken(receivedToken);
      setUser(receivedUser);

      // sync theme preference if no local storage preference exists below this code block
      const existingLocalTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!existingLocalTheme && receivedUser.themePreference) {
        setTheme(receivedUser.themePreference);
      }

      return { success: true, user: receivedUser };
    }
    return { success: false, message: response.data?.message || 'Registration failed' };
  };

  // login user function below this code block (AUTH-003)
  const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
      } catch (err) {
        console.warn('[AuthContext] Unable to store token in localStorage:', err);
      }
      setToken(receivedToken);
      setUser(receivedUser);

      // sync theme preference if no local storage preference exists below this code block
      const existingLocalTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!existingLocalTheme && receivedUser.themePreference) {
        setTheme(receivedUser.themePreference);
      }

      return { success: true, user: receivedUser };
    }
    return { success: false, message: response.data?.message || 'Login failed' };
  };

  // update user profile and preferences function below this code block (PROF-001 to PROF-003)
  const updateUserProfile = async (updates) => {
    const response = await api.patch('/users/profile', updates);
    if (response.data?.success && response.data?.user) {
      const updatedUser = response.data.user;
      setUser(updatedUser);

      // sync theme if theme preference was updated below this code block
      if (updates.themePreference) {
        setTheme(updates.themePreference);
      }

      return { success: true, user: updatedUser };
    }
    return { success: false, message: response.data?.message || 'Profile update failed' };
  };

  // computed authentication state below this code block
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// custom useAuth hook export below this code block
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// default export below this code block
export default AuthContext;
