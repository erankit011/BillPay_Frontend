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
      <div className="animate-fade-in px-2 sm:px-0">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('Check Your Email')}</h2>
          <p className="text-gray-600 text-sm">
            {t('We have sent a password reset link to')} <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm leading-relaxed">
            📧 {t('Please check your inbox and click the reset link. The link will expire in 10 minutes.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-2 sm:px-0">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('Forgot Password?')}</h2>
        <p className="text-gray-500 text-sm mt-2">
          {t('Enter your email address and we will send you a link to reset your password.')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            {t('Email Address')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('Send Reset Link')
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
