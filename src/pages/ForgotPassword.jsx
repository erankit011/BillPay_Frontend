import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto px-4 md:px-6 animate-fade-in">
        <div className="glass-panel rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full mb-3 md:mb-4">
              <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{t('Check Your Email')}</h2>
            <p className="text-gray-600 text-sm md:text-base font-medium">
              {t('We have sent a password reset link to')} <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm md:text-base leading-relaxed font-medium">
              📧 {t('Please check your inbox and click the reset link. The link will expire in 10 minutes.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 md:px-6 animate-fade-in">
      <div className="glass-panel rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t('Forgot Password?')}</h2>
          <p className="text-gray-500 text-sm md:text-base mt-2 font-medium">
            {t('Enter your email address and we will send you a link to reset your password.')}
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
              <Mail className="w-4 h-4 inline mr-1.5" />
              {t('Email Address')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer w-full flex justify-center py-2.5 md:py-3 px-4 rounded-full text-sm md:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all active:scale-95 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('Send Reset Link')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
