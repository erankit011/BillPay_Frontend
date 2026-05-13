import React, { useEffect } from 'react';
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
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            dispatch(setUser(res.data.data));
          } else {
             // Handle invalid token
             localStorage.removeItem('token');
             dispatch(setLoading(false));
          }
        } catch (error) {
          localStorage.removeItem('token');
          dispatch(setLoading(false));
        }
      } else {
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
