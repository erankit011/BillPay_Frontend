import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
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
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 429) {
      // Import toast inside the function to avoid circular dependency or top-level issues, or assume it's imported.
      // Wait, let's just add it and import at the top.
      const toast = await import('react-hot-toast').then(m => m.default);
      toast.error(error.response?.data?.message || 'Too many requests, please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
