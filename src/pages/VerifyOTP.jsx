/**
 * Reusable One-Time Password (OTP) Verification Page
 * Handles dual-mode 6-digit cryptographic verification for account signup and step-up login.
 */

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Clock, ArrowRight, RotateCcw, Headphones, AlertCircle } from 'lucide-react';
import { loginSuccess } from '../redux/slices/authSlice';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

/**
 * Reusable OTP Verification Component
 *
 * @param {Object} props - Component properties
 * @param {string} props.type - Verification mode ('registration' | 'login')
 */
const VerifyOTP = ({ type = 'registration' }) => {
  const [otpValue, setOtpValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const email = location.state?.email;

  const config = {
    registration: {
      verifyEndpoint: '/auth/verify-email',
      resendEndpoint: '/auth/resend-verification-otp',
    },
    login: {
      verifyEndpoint: '/auth/login/verify-otp',
      resendEndpoint: '/auth/login/send-otp',
    }
  };

  const currentConfig = config[type];

  useEffect(() => {
    if (!email) {
      navigate(type === 'registration' ? '/register' : '/login');
    }
  }, [email, navigate, type]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskEmail = (emailAddr) => {
    if (!emailAddr) return '';
    const [username, domain] = emailAddr.split('@');
    const maskedUsername = username.substring(0, 2) + '••••';
    return `${maskedUsername}@${domain}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(value);
    if (errorMessage) setErrorMessage('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast.error('Please enter complete 6-digit code');
      setErrorMessage('Please enter complete 6-digit code');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post(currentConfig.verifyEndpoint, { email, otp: otpValue });
      if (res.data.success) {
        toast.success(t('OTP verified successfully!'));
        const payloadData = res.data.data;
        const userObj = payloadData?.user || payloadData;
        dispatch(loginSuccess({ user: userObj }));
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code. Please try again.';
      toast.error(msg);
      setErrorMessage(msg);
      setOtpValue('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);

    try {
      const res = await api.post(currentConfig.resendEndpoint, { email });
      if (res.data.success) {
        setCanResend(false);
        setTimer(120);
        setOtpValue('');
        inputRef.current?.focus();
        toast.success(res.data.message || t('Verification code sent!'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const timerProgress = (timer / 120) * 100;

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/**
       * Verification Header
       * Screen title and masked user recipient email display
       */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
          {t('Verify Your Identity')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t("We've sent a 6-digit verification code to")}{' '}
          <span className="font-medium text-gray-900">{maskEmail(email)}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {/**
         * Numeric Code Input
         * High-legibility 6-digit code input matching BusinessSetup styling
         */}
        <div>
          <label htmlFor="otp" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5 text-left">
            {t('Verification Code')} <span className="text-red-500">*</span>
          </label>
          <input
            id="otp"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpValue}
            onChange={handleOtpChange}
            className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none ${
              errorMessage
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-[#093C5D] focus:ring-[#093C5D]'
            }`}
            placeholder={t('Enter 6-digit verification code')}
            disabled={isLoading}
            autoFocus
            autoComplete="one-time-code"
          />
          {errorMessage && (
            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/**
         * Countdown Timer & Resend Trigger
         * Flat status bar with timer progress and trigger action
         */}
        <div className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-lg border border-gray-200">
          {timer > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={timer > 30 ? '#093C5D' : '#ef4444'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${timerProgress * 0.942} 100`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <Clock className="w-2.5 h-2.5 text-gray-400 absolute" />
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {t('Code expires in')}
                </span>
              </div>
              <span className={`text-xs sm:text-sm font-semibold tabular-nums ${timer > 30 ? 'text-[#093C5D]' : 'text-red-600'}`}>
                {formatTime(timer)}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs text-gray-500 font-medium">
                {t("Didn't receive the code?")}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-xs font-semibold text-[#093C5D] hover:underline cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('Sending...')}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('Resend Code')}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/**
         * Verification Action Button
         * Flat zero-shadow primary button for submitting verification code
         */}
        <button
          type="submit"
          disabled={isLoading || otpValue.length !== 6}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#072c44] text-white rounded-lg py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.99] mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('Verifying...')}</span>
            </>
          ) : (
            <>
              <span>{type === 'login' ? t('Verify & Login') : t('Verify Account')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/**
       * Helpdesk Support Shortcut
       * Direct button for users requiring technical support
       */}
      <div className="mt-8 pt-5 border-t border-gray-200 flex flex-col items-center">
        <button
          type="button"
          onClick={() => navigate('/contact-support')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-50 text-gray-700 cursor-pointer hover:bg-gray-100 font-medium text-xs transition-colors border border-gray-200"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>{t('Need help? Contact Support')}</span>
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
