/**
 * Forgot Password Email Recovery Page
 * Dispatches cryptographically signed password reset links to registered email addresses.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../api/axios';

/**
 * ForgotPassword Component
 */
const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setErrorMessage(t('Please provide a valid email address'));
      toast.error(t('Please enter a valid email address'));
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('Failed to send reset link. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full animate-fade-in text-center lg:text-left">
        {/**
         * Recovery Link Dispatch Success View
         * Confirms dispatch of time-limited password reset credentials
         */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg flex items-center justify-center mb-4 mx-auto lg:mx-0 shadow-none">
            <CheckCircle2 className="w-6 h-6 text-[#0D7A57]" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B] mb-1.5 tracking-tight">
            {t('Check Your Email')}
          </h2>
          <p className="text-[#757F94] font-medium text-xs sm:text-sm leading-relaxed">
            {t('If an account exists, a password reset link has been sent to')} <strong className="text-[#191E2B] font-semibold">{email}</strong>
          </p>
        </div>

        <div className="bg-[#EEF0FB] border border-[#D8DCF5] rounded-lg p-3.5 sm:p-4 mb-6 text-left shadow-none">
          <p className="text-[#4338CA] text-xs sm:text-sm leading-relaxed font-medium">
            📧 {t('Please check your inbox and click the reset link. The link will expire in 10 minutes.')}
          </p>
        </div>

        <Link
          to="/login"
          className="w-full cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center transition-colors shadow-none active:scale-[0.99]"
        >
          {t('Back to Sign In')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/**
       * Recovery Request Header
       * Explains self-service credential recovery workflow
       */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B] mb-1.5 tracking-tight">
          {t('Forgot Password?')}
        </h2>
        <p className="text-[#757F94] font-medium text-xs sm:text-sm leading-relaxed">
          {t('Enter your email address and we will send you a link to reset your password.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/**
         * Recovery Email Input
         * Collects registered user email address matching BusinessSetup styling
         */}
        <div>
          <label htmlFor="recoveryEmail" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5 text-left">
            {t('Email Address')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            id="recoveryEmail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3.5 py-2.5 text-sm md:text-base font-medium text-[#191E2B] placeholder:text-[#9AA4B8] placeholder:font-normal transition-colors duration-200 focus:outline-none shadow-none ${
              errorMessage
                ? 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20'
                : 'border-[#DCE1EA] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20'
            }`}
            placeholder={t('Enter your registered email')}
            required
            autoFocus
          />
          {errorMessage && (
            <p className="text-[#B91C1C] text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/**
         * Dispatch Recovery Link Action
         * Flat primary submit button triggering password reset email delivery
         */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.99] mt-2 shadow-none"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('Sending Reset Link...')}</span>
            </>
          ) : (
            <span>{t('Send Reset Link')}</span>
          )}
        </button>
      </form>

      {/**
       * Return to Login Link
       * Direct navigation shortcut for users remembering their credentials
       */}
      <div className="mt-6 sm:mt-7 text-center text-xs sm:text-sm">
        <span className="text-[#757F94] font-medium">
          {t('Remember your password?')}
          <Link to="/login" className="text-[#4338CA] hover:text-[#3730A3] font-semibold cursor-pointer ml-1.5 hover:underline">
            {t('Login Here')}
          </Link>
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;
