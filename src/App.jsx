import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { store } from './redux/store';
import AppRoutes from './routes/AppRoutes';
import { setLoading, setUser } from './redux/slices/authSlice';
import api from './api/axios';

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
        }
        dispatch(setLoading(false));
      }
    };
    initAuth();
  }, [dispatch]);

  if (isNetworkError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Server Unreachable</h2>
        <p className="text-gray-600 mb-6 max-w-md">We couldn't connect to our servers. Please check your internet connection or the server might be restarting.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-[#093C5D] hover:bg-[#082a42] text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Retry Connection
        </button>
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
            <AppRoutes />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
