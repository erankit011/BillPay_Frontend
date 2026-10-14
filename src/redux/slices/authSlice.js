import { createSlice } from '@reduxjs/toolkit';

// Purge any legacy token from localStorage to enforce strict httpOnly cookie security
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('accessToken');
  } catch (e) {}
}

const hasSession = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

const initialState = {
  user: null,
  isAuthenticated: hasSession,
  isLoading: hasSession,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const payload = action.payload.user || action.payload;
      state.user = payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      localStorage.setItem('isLoggedIn', 'true');
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('isLoggedIn');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      localStorage.setItem('isLoggedIn', 'true');
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
