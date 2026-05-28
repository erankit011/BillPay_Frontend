import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Shield, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const email = location.state?.email;
  const userName = location.state?.name || 'User';

  // Configuration based on type
  const config = {
    registration: {
      icon: Mail,
      title: 'Verify Your Email',
      subtitle: 'We sent a verification code to',
      helpText: 'Check your email for the code',
      backLink: '/register',
      backText: 'Back to Register',
      verifyEndpoint: '/auth/verify-email',
      resendEndpoint: '/auth/resend-verification-otp',
      successMessage: 'Email Verified!',
      successSubtext: 'Your account has been verified successfully.',
    },
    login: {
      icon: Shield,
      title: 'Verify Your Identity',
      subtitle: 'We sent a verification code to',
      helpText: 'This is an extra security step to protect your account',
      backLink: '/login',
      backText: 'Back to Login',
      verifyEndpoint: '/auth/login/verify-password-otp',
      resendEndpoint: '/auth/login/resend-password-otp',
      successMessage: 'Login Successful!',
      successSubtext: `Welcome back, ${userName}!`,
    }
  };

  const currentConfig = config[type];
  const IconComponent = currentConfig.icon;

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate(currentConfig.backLink);
    }
  }, [email, navigate, currentConfig.backLink]);

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  // Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit OTP');
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

        // Show success
        setSuccess(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
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
        document.getElementById('otp-0')?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="text-center animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t(currentConfig.successMessage)}
        </h2>
        <p className="text-gray-600 mb-4">
          {t(currentConfig.successSubtext)}
        </p>
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('Redirecting to dashboard...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-scale-in">
          <IconComponent className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t(currentConfig.title)}
        </h2>
        <p className="text-gray-600 text-sm">
          {t(currentConfig.subtitle)}
        </p>
        <p className="text-blue-600 font-semibold mt-1 text-sm">{email}</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200 animate-scale-in">
          {error}
        </div>
      )}

      {/* OTP Input */}
      <form onSubmit={handleVerify} className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            <KeyRound className="w-4 h-4 inline mr-1" />
            {t('Enter 6-Digit Code')}
          </label>
          <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                disabled={isLoading}
              />
            ))}
          </div>
          {timer > 0 && (
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 mt-2">
              <span className="animate-pulse">⏱️</span>
              <span>{formatTime(timer)}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 text-center mt-2">
            {type === 'login' 
              ? t('This is an extra security step to protect your account')
              : t('Check your email for the code')
            }
          </p>
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-lift transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t('Verifying...')}
            </>
          ) : (
            t(type === 'registration' ? 'Verify Email' : 'Verify & Login')
          )}
        </button>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || resendLoading}
          className={`w-full text-sm font-medium py-2 rounded-lg transition-all ${
            canResend
              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          {resendLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              {t('Sending...')}
            </>
          ) : !canResend && timer > 0 ? (
            <>
              {t('Resend code in')} {formatTime(timer)}
            </>
          ) : (
            t('Resend Code')
          )}
        </button>
      </form>

      {/* Help text */}
      <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
        <p className="text-xs text-gray-500">
          {t("Didn't receive the code? Check your spam folder")}
          {type === 'registration' && (
            <>
              {' or '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('use a different email')}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
