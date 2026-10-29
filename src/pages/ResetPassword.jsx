/**
 * Token-Verified Password Reset Page
 * Validates reset token parameter from URL, verifies password matching, and updates account credentials.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

/**
 * ResetPassword Component
 */
const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      const msg = t('Password must be at least 6 characters long');
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = t('Passwords do not match');
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${resetToken}`, { password });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('Failed to reset password. The link may have expired.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full animate-fade-in text-center lg:text-left">
        {/**
         * Password Reset Completion Success View
         * Confirms credential update and triggers delayed navigation redirect
         */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center mb-4 mx-auto lg:mx-0">
            <Lock className="w-6 h-6 text-[#2ECC71]" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
            {t('Password Reset Successful!')}
          </h2>
          <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
            {t('Your password has been reset successfully. Redirecting to login...')}
          </p>
          <div className="flex justify-center lg:justify-start">
            <div className="w-6 h-6 border-2 border-[#093C5D] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/**
       * Credential Reset Header
       * Visual badge and instructions for setting a new secure password
       */}
      <div className="mb-6">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#093C5D] text-white flex items-center justify-center mb-3 sm:mb-4 mx-auto lg:mx-0">
          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
          {t('Reset Password')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Enter your new password below.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/**
         * New Password Input Field
         * Collects new password credential with visibility toggle matching BusinessSetup styling
         */}
        <div>
          <label htmlFor="newPassword" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('New Password')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="block w-full rounded-lg border bg-white pl-3.5 pr-11 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]"
              placeholder={t('Enter new password (min 6 characters)')}
              required
              minLength={6}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="cursor-pointer absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-md flex items-center justify-center focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 font-medium text-left">
            {t('Must be at least 6 characters')}
          </p>
        </div>

        {/**
         * Confirm Password Input Field
         * Collects confirmation password credential to prevent typographical errors
         */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Confirm Password')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="block w-full rounded-lg border bg-white pl-3.5 pr-11 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]"
              placeholder={t('Re-enter new password')}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="cursor-pointer absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-md flex items-center justify-center focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs font-medium flex items-center gap-1 text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {/**
         * Submit New Password Action
         * Flat primary action button committing credential update
         */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#072c44] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.99] mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('Resetting Password...')}</span>
            </>
          ) : (
            <span>{t('Reset Password')}</span>
          )}
        </button>
      </form>

      {/**
       * Return to Login Link
       * Direct navigation back to login page
       */}
      <div className="mt-6 sm:mt-7 text-center text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">
          {t('Remember your password?')}
          <Link to="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1.5 hover:underline">
            {t('Login Here')}
          </Link>
        </span>
      </div>
    </div>
  );
};

export default ResetPassword;
