/**
 * User & Administrator Sign-In Authentication Page
 * Handles credential verification via secure httpOnly cookies, maintenance alerts, and session redirection.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Login Form Validation Schema
 */
const loginSchema = yup.object({
  email: yup.string().email('Please provide a valid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

/**
 * Login Component
 */
const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(null);
  const [suspensionMessage, setSuspensionMessage] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    api.get('/support/contact-info')
      .then((res) => {
        if (isMounted && res.data?.data?.isMaintenanceMode && res.data?.data?.maintenanceMessage) {
          setMaintenanceMessage(res.data.data.maintenanceMessage);
        }
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    if (params.get('session_expired')) {
      toast.error(t('This device was logged out remotely. Please sign in again.'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (params.get('suspended')) {
      const reason = params.get('reason') || '';
      setSuspensionMessage(
        reason
          ? `${t('Your shop account has been suspended by the administrator.')} (${t('Reason')}: ${reason})`
          : t('Your shop account has been suspended by the administrator. Please contact support.')
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      isMounted = false;
    };
  }, [t]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login/verify-password', data);

      if (res.data.success) {
        toast.success(t('Login successful!'));
        navigate('/verify-login-otp', {
          state: {
            email: data.email,
            name: res.data.data.name
          }
        });
      }
    } catch (err) {
      const errData = err.response?.data;
      const errMsg = errData?.message || 'Invalid credentials. Please try again.';

      /**
       * Unverified Identity & Suspension Evaluation
       * Redirects unverified merchants to OTP screen and renders formal suspension alerts
       */
      if (err.response?.status === 403) {
        if (errData?.code === 'EMAIL_NOT_VERIFIED' || errMsg.toLowerCase().includes('not verified')) {
          toast.error(errMsg);
          navigate('/verify-email', {
            state: {
              email: errData?.email || data.email,
              name: errData?.name || ''
            }
          });
          return;
        }

        if (errMsg.toLowerCase().includes('suspended')) {
          setSuspensionMessage(errMsg);
        }
      }
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/**
       * Authentication Header
       * Screen title and brief instructional prompt for merchant sign-in
       */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
          {t('Sign In')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Please enter your details to sign in.')}
        </p>
      </div>

      {/**
       * Platform Maintenance Notice
       * Flat alert banner displayed when system administrator enables maintenance mode
       */}
      {maintenanceMessage && (
        <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm text-amber-900">{t('Platform Maintenance Active')}</p>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed font-normal">{maintenanceMessage}</p>
          </div>
        </div>
      )}

      {/**
       * Account Suspension Notification
       * Flat warning card shown when storekeeper account has been suspended by admin
       */}
      {suspensionMessage && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm font-medium flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-xs sm:text-sm text-rose-900 tracking-tight">
                {t('Store Account Suspended')}
              </p>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200/80 text-rose-900">
                {t('Restricted')}
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-800 leading-relaxed font-normal break-words">
              {suspensionMessage}
            </p>
            <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center gap-3">
              <Link
                to="/contact-support"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 underline underline-offset-2"
              >
                {t('Contact Platform Support')} →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/**
       * User Credentials Form
       * Flat validated form inputs with responsive typography and zero shadows
       */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/**
         * Email Input Field
         * Clean validated email address input without icon matching BusinessSetup styling
         */}
        <div>
          <label htmlFor="email" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Email Address')} <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]'
            }`}
            placeholder={t('Enter your registered email')}
            autoFocus
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/**
         * Password Input Field
         * Password input with vertically centered show/hide eye toggle
         */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs sm:text-[13px] font-medium text-gray-700 text-left">
              {t('Password')} <span className="text-red-500">*</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs sm:text-[13px] font-medium text-[#093C5D] hover:underline transition-colors"
            >
              {t('Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={`block w-full rounded-lg border bg-white pl-3.5 pr-11 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]'
              }`}
              placeholder={t('Enter your password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="cursor-pointer absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-md flex items-center justify-center focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/**
         * Authentication Submit Action
         * Zero-shadow flat primary button matching app brand color
         */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#072c44] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.99] mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('Signing in...')}</span>
            </>
          ) : (
            <span>{t('Sign In')}</span>
          )}
        </button>
      </form>

      {/**
       * Third-Party Social Authentication
       * Flat Google OAuth single sign-on redirect button
       */}
      <div className="mt-6 sm:mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2.5 bg-white text-gray-500 font-medium">{t('Or continue with')}</span>
          </div>
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="mt-4 sm:mt-5 w-full cursor-pointer py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors active:scale-[0.99]"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('Continue With Google')}
        </a>

        {/**
         * Registration Link Footer
         * Navigation redirect for new merchants wishing to register a business account
         */}
        <div className="mt-6 sm:mt-7 text-center text-xs sm:text-sm">
          <span className="text-gray-500 font-medium">
            {t('Don’t have an account?')}
            <Link to="/register" className="text-[#093C5D] font-semibold cursor-pointer ml-1.5 hover:underline">
              {t('Sign Up')}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
