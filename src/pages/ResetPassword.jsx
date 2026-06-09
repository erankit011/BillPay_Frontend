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
      <div className="w-full max-w-md mx-auto px-4 md:px-6 animate-fade-in">
        <div className="glass-panel rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full mb-3 md:mb-4">
              <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{t('Password Reset Successful!')}</h2>
            <p className="text-gray-600 text-sm md:text-base mb-6 font-medium">
              {t('Your password has been reset successfully. Redirecting to login...')}
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 md:px-6 animate-fade-in">
      <div className="glass-panel rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t('Reset Password')}</h2>
          <p className="text-gray-500 text-sm md:text-base mt-2 font-medium">
            {t('Enter your new password below.')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm md:text-base border border-red-200 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1.5" />
              {t('New Password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 pr-11 md:pr-12 text-sm md:text-base font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{t('Must be at least 6 characters')}</p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1.5" />
              {t('Confirm Password')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 pr-11 md:pr-12 text-sm md:text-base font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cursor-pointer absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer w-full flex justify-center py-2.5 md:py-3 px-4 rounded-full text-sm md:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all active:scale-95 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('Reset Password')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
