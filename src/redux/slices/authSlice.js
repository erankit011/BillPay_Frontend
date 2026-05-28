import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // initial load checks auth
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user || action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Tokens are stored in httpOnly cookies (no localStorage needed)
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      // Cookies are cleared by server on logout
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
