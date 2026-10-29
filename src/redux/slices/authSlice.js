/**
 * Authentication Redux Slice
 * Manages user profile state, session authentication status, hydration loading flags,
 * and localStorage session markers for httpOnly cookie workflows.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * Legacy Token Purge
 * Enforces httpOnly cookie security by removing any stale localStorage tokens
 */
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

/**
 * Auth State Slice Definition
 */
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
