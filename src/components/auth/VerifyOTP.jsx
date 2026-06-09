import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Shield, Clock, ArrowRight } from 'lucide-react';
import { loginSuccess } from '../../redux/slices/authSlice';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';

/**
 * Reusable OTP Verification Component
 * Used for both Registration and Login OTP verification
 * 
 * @param {string} type - 'registration' or 'login'
 */
const VerifyOTP = ({ type = 'registration' }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const email = location.state?.email;
  const userName = location.state?.name || 'User';

  // Configuration based on type
  const config = {
    registration: {
      title: 'Verify Your Identity',
      verifyEndpoint: '/auth/verify-email',
      resendEndpoint: '/auth/resend-verification-otp',
    },
    login: {
      title: 'Verify Your Identity',
      verifyEndpoint: '/auth/login/verify-password-otp',
      resendEndpoint: '/auth/login/resend-password-otp',
    }
  };

  const currentConfig = config[type];

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate(type === 'registration' ? '/register' : '/login');
    }
  }, [email, navigate, type]);

  // Timer countdown
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

  // Format timer (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mask email
  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 1) + '****';
    return `${maskedUsername}@${domain}`;
  };

  // Handle OTP input change
  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post(currentConfig.verifyEndpoint, {
        email,
        otp: otpCode,
      });

      if (res.data.success) {
        // Store access token
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('token', res.data.data.accessToken);

        // Dispatch to Redux
        dispatch(loginSuccess({
          user: res.data.data,
          token: res.data.data.accessToken,
        }));

        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError(null);

    try {
      const res = await api.post(currentConfig.resendEndpoint, { email });

      if (res.data.success) {
        setCanResend(false);
        setTimer(120);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6">
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 animate-fade-in">
        {/* Shield Icon */}
        <div className="flex justify-center mb-5 sm:mb-6 animate-scale-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">
            {t('Verify Your Identity')}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-1">
            {t("We've sent a 6-digit verification code")}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm mb-2">
            {t('to')}
          </p>
          <p className="text-gray-900 font-semibold text-sm sm:text-base">
            {maskEmail(email)}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-red-200 animate-scale-in text-center">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
          <div className="flex gap-2 sm:gap-2.5 md:gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center text-lg sm:text-xl md:text-2xl font-semibold bg-white border-2 border-gray-200 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-900"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-gray-600">
              {t('Code expires in')}
            </span>
            <span className="text-indigo-600 font-semibold">
              {formatTime(timer)}
            </span>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('Verifying...')}</span>
              </>
            ) : (
              <>
                <span>{t('Verify & Login')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </button>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {t("Didn't receive the code?")}{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resendLoading}
                className={`font-semibold transition-colors ${
                  canResend
                    ? 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {resendLoading ? t('Sending...') : t('Resend')}
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Help Link */}
      <div className="text-center mt-4 sm:mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => navigate('/help')}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
          <span className="underline">{t('Need help accessing your account?')}</span>
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
