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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Caching time: 1 minute (Data refresh background me tabhi hoga jab 1 min ho chuka ho)
      staleTime: 1 * 60 * 1000,
      // Garbage Collection Time: 5 minutes (Memory se data tab hatega jab 5 min tak page use na ho)
      gcTime: 5 * 60 * 1000, 
    },
  },
});

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const [isNetworkError, setIsNetworkError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          dispatch(setUser(res.data.data));
        }
      } catch (error) {
        if (!error.response) {
          // Network error or Server Down
          setIsNetworkError(true);
          dispatch(setLoading(false));
        } else {
          dispatch(logout());
        }
      }
    };
    initAuth();
  }, [dispatch]);

  if (isNetworkError) {
    return <ServerUnreachable />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
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
                    border: '1px solid #bbf7d0', // green-200
                    background: '#f0fdf4',       // green-50
                    color: '#15803d',            // green-700
                  },
                  iconTheme: {
                    primary: '#16a34a',
                    secondary: '#f0fdf4',
                  },
                },
                error: {
                  style: {
                    border: '1px solid #fecaca', // red-200
                    background: '#fef2f2',       // red-50
                    color: '#b91c1c',            // red-700
                  },
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fef2f2',
                  },
                }
              }}
            />
            <AppRoutes />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
