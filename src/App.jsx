/**
 * Primary Application Shell & Context Provider Root
 * Orchestrates Redux store hydration, TanStack Query caching policies,
 * global routing context, authentication lifecycle, PWA lifecycle, and toast notifications.
 */

import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { store } from './redux/store';
import AppRoutes from './routes/AppRoutes';
import { setLoading, setUser, logout } from './redux/slices/authSlice';
import api from './api/axios';
import ServerUnreachable from './components/common/ServerUnreachable';
import SwirlingLoader from './components/common/SwirlingLoader';
import { Toaster } from 'react-hot-toast';
import { PWAProvider, UpdatePromptModal } from './features/pwa';

/**
 * Global TanStack Query Configuration
 * Establishes caching intervals, garbage collection cycles, and background refetch behavior.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      /**
       * Fresh Data Window (1 Minute)
       * Background refetch initiates only after cache lifetime exceeds one minute
       */
      staleTime: 1 * 60 * 1000,
      /**
       * Garbage Collection Cycle (5 Minutes)
       * Evicts unmounted and inactive query cache from browser memory
       */
      gcTime: 5 * 60 * 1000, 
    },
  },
});

/**
 * Authentication Initializer Wrapper
 * Verifies active session state via httpOnly cookies on initial boot,
 * skips redundant queries on public landing pages, and handles connection downtime.
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const [isNetworkError, setIsNetworkError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      /**
       * Public Route Bypass Check
       * Prevents unnecessary auth verification requests for unauthenticated visitors
       */
      const isPublicPath = () => {
        const path = window.location.pathname;
        return (
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/verify') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password') ||
          path.startsWith('/privacy') ||
          path.startsWith('/terms') ||
          path.startsWith('/contact-support') ||
          path.startsWith('/invoice/public/') ||
          path.startsWith('/bills/') ||
          path.startsWith('/oauth-callback')
        );
      };

      const hasSession = localStorage.getItem('isLoggedIn') === 'true';
      if (!hasSession && isPublicPath()) {
        dispatch(setLoading(false));
        return;
      }

      /**
       * Session Verification Request
       * Hydrates authenticated user state via secure credentials
       */
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          dispatch(setUser(res.data.data));
        }
      } catch (error) {
        if (!error.response) {
          /**
           * Network Connection Failure Handler
           * Detects offline status or unreachable API server
           */
          setIsNetworkError(true);
          dispatch(setLoading(false));
        } else {
          dispatch(logout());
        }
      }
    };
    initAuth();
  }, [dispatch]);

  /**
   * Network Offline Fallback Screen
   */
  if (isNetworkError) {
    return <ServerUnreachable />;
  }

  /**
   * Initial Session Hydration Loader
   */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  return children;
};

/**
 * Root Application Component Hierarchy
 */
const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PWAProvider>
            <AuthInitializer>
              {/**
               * Universal Notification Toast Container
               * Global toast overlay for mutations, feedback notifications, and network alerts
               */}
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  style: {
                    boxShadow: 'none',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                    fontWeight: '500',
                    fontSize: '14px'
                  },
                  success: {
                    style: {
                      border: '1px solid #bbf7d0',
                      background: '#f0fdf4',
                      color: '#15803d',
                    },
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#f0fdf4',
                    },
                  },
                  error: {
                    style: {
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#b91c1c',
                    },
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#fef2f2',
                    },
                  }
                }}
              />
              {/**
               * PWA Service Worker Update Prompt Dialog
               * Notifies user when a new application version has been pre-cached
               */}
              <UpdatePromptModal />
              {/**
               * Dynamic Application Routes
               * Lazy-loaded route definitions with suspense boundaries
               */}
              <AppRoutes />
            </AuthInitializer>
          </PWAProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
