import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetToken } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full animate-fade-in text-center lg:text-left">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">{t('Password Reset Successful!')}</h2>
          <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
            {t('Your password has been reset successfully. Redirecting to login...')}
          </p>
          <div className="flex justify-center lg:justify-start">
            <div className="w-5 h-5 border-2 border-[#093C5D] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      <div className="mb-5 sm:mb-6">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#093C5D] flex items-center justify-center mb-3 sm:mb-4 mx-auto lg:mx-0">
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">{t('Reset Password')}</h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Enter your new password below.')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm font-medium border border-red-100/50 animate-scale-in text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
            {t('New Password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border bg-white pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 p-1.5 sm:p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-4 sm:h-4" /> : <Eye className="w-4 h-4 sm:w-4 sm:h-4" />}
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 font-medium text-left">{t('Must be at least 6 characters')}</p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
            {t('Confirm Password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-full border bg-white pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="cursor-pointer absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 p-1.5 sm:p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-4 sm:h-4" /> : <Eye className="w-4 h-4 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white rounded-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
          ) : (
            t('Reset Password')
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
