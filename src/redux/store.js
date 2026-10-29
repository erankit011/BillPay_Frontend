/**
 * Central Redux State Store Configuration
 * Assembles sliced state reducers for authentication and tenant session lifecycle.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Root Redux Store Instance
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
