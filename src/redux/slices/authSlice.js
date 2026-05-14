import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('accessToken') || localStorage.getItem('token') || null,
  isAuthenticated: !!(localStorage.getItem('accessToken') || localStorage.getItem('token')),
  isLoading: true, // initial load checks auth
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken || action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Store access token
      localStorage.setItem('accessToken', action.payload.accessToken || action.payload.token);
      localStorage.setItem('token', action.payload.accessToken || action.payload.token); // Backward compatibility
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Clear all tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    refreshToken: (state, action) => {
      state.token = action.payload.accessToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('token', action.payload.accessToken);
    }
  },
});

export const { loginSuccess, logout, setUser, setLoading, refreshToken } = authSlice.actions;
export default authSlice.reducer;
