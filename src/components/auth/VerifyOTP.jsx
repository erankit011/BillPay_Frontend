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
    <div className="w-full flex justify-center animate-fade-in relative z-10">
      <div className="w-full max-w-md pt-2 pb-6 px-1 sm:px-4 flex flex-col items-center">
        
        {/* Shield Icon Container */}
        <div className="mb-6 sm:mb-8 animate-scale-in">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#113853] flex items-center justify-center shadow-lg">
            <Shield className="w-9 h-9 sm:w-11 sm:h-11 text-white stroke-[2]" />
          </div>
        </div>

        {/* Headlines */}
        <div className="text-center w-full mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-[32px] font-bold text-gray-900 mb-4 sm:mb-5 tracking-tight">
            {t('Verify Your Identity')}
          </h2>
          <div className="text-gray-500 text-sm sm:text-base font-medium leading-[1.6]">
            <p>{t("We've sent a 6-digit verification code")}</p>
            <p className="mb-2">{t('to')}</p>
            <p className="text-gray-900 font-bold tracking-wide text-base sm:text-lg">
              {maskEmail(email)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 animate-scale-in text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="w-full space-y-8">
          {/* OTP Input Rings */}
          <div className="flex justify-center gap-2 sm:gap-3 md:gap-4" onPaste={handlePaste}>
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
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-center text-xl sm:text-2xl font-semibold bg-white border border-gray-200 rounded-full focus:border-[#8BA0B3] focus:ring-2 focus:ring-[#8BA0B3]/20 transition-all outline-none text-gray-900 shadow-sm placeholder-gray-300"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Code Expires Timer */}
          <div className="flex items-center justify-center gap-2 text-[15px] pt-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 font-medium">
              {t('Code expires in')}
            </span>
            <span className="text-[#113853] font-bold">
              {formatTime(timer)}
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full h-14 sm:h-[60px] cursor-pointer bg-[#8BA0B3] hover:bg-[#788E9E] text-white rounded-[30px] font-bold text-[17px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-[2.5px] border-white border-t-white/30 rounded-full animate-spin" />
                <span>{t('Verifying...')}</span>
              </>
            ) : (
              <>
                <span>{type === 'login' ? t('Verify & Login') : t('Verify Account')}</span>
                <ArrowRight className="w-5 h-5 ml-1 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Resend Actions */}
          <div className="text-center pt-1">
            <span className="text-gray-500 text-[15px] font-medium">
              {t("Didn't receive the code?")}{' '}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className={`text-[15px] font-bold ml-1 transition-colors ${
                canResend
                  ? 'text-[#8BA0B3] hover:text-[#5F7485] cursor-pointer'
                  : 'text-[#A0AAB3] cursor-not-allowed'
              }`}
            >
               {resendLoading ? t('Sending...') : t('Resend')}
            </button>
          </div>
        </form>

        {/* Footer Help */}
        <div className="text-center mt-10 sm:mt-12 animate-fade-in w-full" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => navigate('/help')}
            className="text-[15px] text-gray-500 hover:text-gray-900 font-medium flex items-center justify-center gap-2.5 mx-auto transition-colors"
          >
            <div className="w-5 h-5 rounded-full border-[1.5px] border-gray-400 text-gray-500 flex items-center justify-center font-bold font-serif text-[12px]">
              ?
            </div>
            <span className="underline decoration-gray-300 underline-offset-[5px] decoration-[1.5px]">{t('Need help accessing your account?')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default VerifyOTP;
