// imports for axios library below this code block
import axios from 'axios';

// local storage token key definition below this code block
export const TOKEN_STORAGE_KEY = 'career_ai_token';

// session expired custom event identifier below this code block
export const SESSION_EXPIRED_EVENT = 'career_ai_session_expired';

// sanitized base api url ensuring trailing /api is present below this code block
let rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawBase = rawBase.replace(/\/+$/, '');
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
export const API_BASE_URL = baseURL;

// centralized axios instance configuration below this code block
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 6000 // 6000ms default request timeout to prevent indefinite hanging
});


// request interceptor to automatically attach authorization bearer token below this code block
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API Interceptor] Failed to retrieve token from localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor to handle unauthorized 401 session expirations cleanly below this code block (AUTH-004)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // check if error response exists and has status 401 below this code block
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config ? error.config.url || '' : '';

      // avoid triggering session expiration redirect on failed login attempts below this code block
      const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (!isAuthAttempt) {
        try {
          // purge expired or invalid token from browser storage below this code block
          localStorage.removeItem('token');
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch (e) {
          console.warn('[API Interceptor] Unable to remove expired token:', e);
        }

        // dispatch global window event notifying application of session termination below this code block
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
            detail: { message: error.response.data?.message || 'Session expired. Please log in again.' }
          }));
        }
      }
    }

    return Promise.reject(error);
  }
);

// default export of configured api instance below this code block
export default api;
