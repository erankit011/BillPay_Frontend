/**
 * Storekeeper Account Registration Page
 * Single-step onboarding collecting merchant name, contact email, phone, and password credentials.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getPublicContactInfo } from '../features/admin/api/adminApi';
import { Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Registration Form Yup Schema
 */
const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Please provide a valid email address').required('Email is required'),
  phone: yup.string().matches(/^(?:\+?91[\-\s]?)?[0]?(?:\d[\-\s]?){10}$/, 'Enter a valid 10-digit number').required('Phone is required'),
  password: yup.string().min(6, 'Must be at least 6 characters').required('Password is required'),
});

/**
 * Register Component
 */
const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    getPublicContactInfo()
      .then((info) => {
        if (isMounted && info) {
          if (info.allowNewRegistrations === false) {
            setAllowRegistration(false);
          }
          if (info.isMaintenanceMode && info.maintenanceMessage) {
            setMaintenanceMessage(info.maintenanceMessage);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', data);

      if (res.data.success) {
        toast.success(t('Registration successful! Please verify OTP.'));
        navigate('/verify-email', {
          state: {
            email: data.email,
            name: data.name
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/**
       * Page Header Section
       * Displays registration title and subtitle
       */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
          {t('Create Account')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Tell us about yourself to get started.')}
        </p>
      </div>

      {/**
       * Platform Maintenance & Closed Registration Alerts
       * Flat informational banners if signups or operations are suspended
       */}
      {maintenanceMessage && (
        <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm text-amber-900">{t('Platform Maintenance Active')}</p>
            <p className="mt-0.5 text-xs text-amber-800 leading-relaxed font-normal">{maintenanceMessage}</p>
          </div>
        </div>
      )}

      {!allowRegistration && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm font-medium flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs sm:text-sm text-rose-900">{t('Registrations Temporarily Closed')}</p>
            <p className="mt-0.5 text-xs text-rose-800 leading-relaxed font-normal">
              {t('New store signups are currently paused by the platform administrator. Please check back later or contact support.')}
            </p>
          </div>
        </div>
      )}

      {/**
       * Unified Single-Step Registration Form
       * Collects merchant profile, contact, and security credentials in one clean step
       */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
        {/**
         * Full Name Field
         */}
        <div>
          <label htmlFor="name" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Full Name')} <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            {...register('name')}
            className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none ${
              errors.name
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]'
            }`}
            placeholder={t('Enter full name (e.g. Ramesh Kumar)')}
            autoFocus
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/**
         * Email Address Field
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
            placeholder={t('Enter business or personal email')}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/**
         * Phone Number Field
         */}
        <div>
          <label htmlFor="phone" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Phone Number')} <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none ${
              errors.phone
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]'
            }`}
            placeholder={t('Enter 10-digit mobile number')}
            maxLength={10}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.phone.message}</span>
            </p>
          )}
        </div>

        {/**
         * Password Field with Eye Toggle
         */}
        <div>
          <label htmlFor="password" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Password')} <span className="text-red-500">*</span>
          </label>
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
              placeholder={t('Create password (min 6 characters)')}
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
         * Submit Action Button
         */}
        <button
          type="submit"
          disabled={isLoading || !allowRegistration}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#072c44] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('Creating Account...')}</span>
            </>
          ) : (
            <span>{t('Create Account')}</span>
          )}
        </button>
      </form>

      {/**
       * Third-Party Social Authentication
       * Alternative OAuth registration via Google account
       */}
      <div className="mt-6 sm:mt-7">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2.5 bg-white text-gray-500 font-medium">{t('Or continue with')}</span>
          </div>
        </div>

        {allowRegistration ? (
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
        ) : (
          <div className="mt-4 sm:mt-5 w-full py-2.5 sm:py-3 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed">
            {t('Google registration is temporarily paused')}
          </div>
        )}
      </div>

      {/**
       * Bottom Navigation Actions
       * Direct link redirecting existing users to login view
       */}
      <div className="mt-6 sm:mt-7 text-center text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">
          {t('Already have an account?')}
          <Link to="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1.5 hover:underline">
            {t('Login Here')}
          </Link>
        </span>
      </div>
    </div>
  );
};

export default Register;
