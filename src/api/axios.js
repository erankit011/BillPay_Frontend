/**
 * Universal Axios HTTP Client Instance
 * Configures base URL routing, credentials handling, CSRF token negotiation,
 * seamless JWT refresh queueing, account suspension intercepts, and rate limit toasts.
 */

import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Pre-configured Axios Instance
 * Enforces httpOnly cookie exchange and standard payload formats across all tenant requests
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token Refresh Request Queue
 * Buffers concurrent 401 requests while a single background token refresh completes
 */
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

/**
 * Request Interceptor
 * Dynamically resolves multipart boundaries and attaches fresh CSRF verification headers
 */
api.interceptors.request.use(async (config) => {
  /**
   * Multipart Form Boundary Handling
   * Strips explicit content-type so browser binds accurate boundary metadata
   */
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  /**
   * CSRF Token Verification Attachment
   * Attaches anti-forgery token to all state-mutating HTTP methods
   */
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

/**
 * Response Interceptor
 * Intercepts expired CSRF errors, merchant account suspensions, remote session revocations,
 * transparent JWT cookie refreshes, and rate-limiting responses
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isPublicPage = () => {
      const path = window.location.pathname;
      return (
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/verify') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/bills/') ||
        path.startsWith('/invoice/public/') ||
        path.startsWith('/privacy') ||
        path.startsWith('/terms') ||
        path.startsWith('/contact-support') ||
        path.startsWith('/oauth-callback')
      );
    };

    /**
     * 1. Automatic CSRF Token Recovery
     * Invalidates cached token and transparently retries state-mutating requests once
     */
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

    /**
     * 2. Merchant Account Suspension Intercept
     * Purges local session markers and redirects suspended storekeeper to notification portal
     */
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes('suspended')
    ) {
      isRefreshing = false;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      const msg = error.response.data.message || '';
      const reasonMatch = msg.match(/Reason:\s*(.+)$/i);
      const reason = reasonMatch ? reasonMatch[1].trim() : '';
      toast.error(msg, { duration: 6000 });
      if (!isPublicPage()) {
        setTimeout(() => {
          window.location.href = `/login?suspended=true${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`;
        }, 1000);
      }
      return Promise.reject(error);
    }

    /**
     * Business Setup Prerequisite Notification
     */
    if (
      error.response?.status === 403 &&
      (error.response?.data?.code === 'BUSINESS_SETUP_REQUIRED' ||
        error.response?.data?.message?.toLowerCase().includes('business setup is required'))
    ) {
      toast.error(error.response.data.message || 'Business profile setup required before performing this action.', {
        id: 'business-setup-required-api',
        duration: 4500,
      });
      return Promise.reject(error);
    }

    /**
     * 3. Remote Invalidation & Force Logout Intercept
     * Terminates revoked sessions and redirects to login with session_expired parameter
     */
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

    /**
     * 4. Transparent Access Token Refresh via httpOnly Cookies
     * Automatically requests new access token on 401 and replays queued requests seamlessly
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      /**
       * Auth Endpoint Refresh Bypass
       * Prevents cyclical renewal loops on public or auth-specific endpoints
       */
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/verify') ||
        originalRequest.url?.includes('/auth/google') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password');

      if (isAuthEndpoint) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      /**
       * Session Authenticity Verification
       * Aborts refresh attempt when no active user session flag exists
       */
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        return Promise.reject(error);
      }

      /**
       * Concurrent Request Buffer
       * Queues parallel requests while access token renewal is in flight
       */
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

    /**
     * 5. Rate Limit (HTTP 429) Throttling Alert
     */
    if (error.response?.status === 429) {
      const serverMessage = error.response?.data?.message;
      const retryAfter = error.response?.data?.retryAfter;
      const message = serverMessage || (retryAfter 
        ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        : 'Too many requests. Please slow down and try again shortly.');

      toast.error(message, {
        id: 'rate-limit-toast',
        duration: 4500,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
