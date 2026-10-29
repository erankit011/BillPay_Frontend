/**
 * Third-Party OAuth Social Callback Handler
 * Receives authorization exchange codes, establishes session cookies, and routes to merchant workspace.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';
import api from '../api/axios';
import SwirlingLoader from '../components/common/SwirlingLoader';
import toast from 'react-hot-toast';

/**
 * OAuthCallback Component
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const error = searchParams.get('error');
    if (error) {
      toast.error('Google sign in failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    const code = searchParams.get('code');

    const finishAuth = async () => {
      try {
        let res;
        if (code) {
          /**
           * Authorization Code Exchange
           * Direct POST exchange setting secure httpOnly session cookies via API response.
           */
          res = await api.post('/auth/google/exchange', { code });
        } else {
          /**
           * Active Session Verification Fallback
           * Checks existing cookie session if no single-use authorization code was provided.
           */
          res = await api.get('/auth/me');
        }

        if (res.data?.success) {
          const user = res.data.data?.user || res.data.data;
          dispatch(loginSuccess({ user }));
          toast.success(`Welcome, ${user.name || 'User'}!`);

          navigate('/dashboard', { replace: true });
        } else {
          toast.error('Failed to load user details.');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Authentication error. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    finishAuth();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D] mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-600">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
