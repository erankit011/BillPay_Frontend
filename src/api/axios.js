import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Automatically sends and receives httpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

let csrfToken = null;
let fetchingCsrf = null;

api.interceptors.request.use(async (config) => {
  // Methods that require CSRF token
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    if (!csrfToken) {
      if (!fetchingCsrf) {
        fetchingCsrf = axios.get(`${import.meta.env.VITE_API_URL}/csrf-token`, { withCredentials: true })
          .then(res => res.data.csrfToken)
          .catch(() => null);
      }
      csrfToken = await fetchingCsrf;
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isPublicPage = () => {
      const path = window.location.pathname;
      return (
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/verify') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/bills/') ||
        path.startsWith('/privacy') ||
        path.startsWith('/terms')
      );
    };

    // 1. Auto-recover from expired CSRF token (transparent retry)
    if (
      error.response?.status === 403 &&
      (error.response?.data?.message?.toLowerCase().includes('csrf') ||
        error.response?.data?.code === 'EBADCSRFTOKEN')
    ) {
      csrfToken = null;
      fetchingCsrf = null;
      if (!originalRequest._csrfRetry) {
        originalRequest._csrfRetry = true;
        return api(originalRequest);
      }
    }

    // 2. If this session was explicitly logged out remotely or revoked:
    if (
      error.response?.status === 401 &&
      (error.response?.data?.message?.includes('logged out remotely') ||
        error.response?.data?.message?.includes('revoked'))
    ) {
      isRefreshing = false;
      localStorage.removeItem('isLoggedIn');
      if (!isPublicPage()) {
        window.location.href = '/login?session_expired=true';
      }
      return Promise.reject(error);
    }

    // 3. Handle Token Refresh on 401 via httpOnly cookies
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt token refresh on auth endpoints (login, register, OTP, forgot/reset password, or refresh itself)
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/verify') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password');

      if (isAuthEndpoint) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      // If user was never logged in, don't attempt refresh
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        return Promise.reject(error);
      }

      // Queue concurrent requests while a single refresh is in-flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');

        if (response.data.success) {
          processQueue(null);
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        localStorage.removeItem('isLoggedIn');
        if (!isPublicPage()) {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 429) {
      toast.error(error.response?.data?.message || 'Too many requests, please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
