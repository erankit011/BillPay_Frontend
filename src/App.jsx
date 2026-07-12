import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          dispatch(setUser(res.data.data));
        }
      } catch (error) {
        dispatch(setLoading(false));
      }
    };
    initAuth();
  }, [dispatch]);

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
