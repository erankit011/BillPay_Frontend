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
      <div className="w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{t('Check Your Email')}</h2>
          <p className="text-base text-gray-500 font-medium">
            {t('We have sent a password reset link to')} <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
          <p className="text-blue-800 text-sm md:text-base leading-relaxed font-medium">
            📧 {t('Please check your inbox and click the reset link. The link will expire in 10 minutes.')}
          </p>
        </div>

        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500 font-medium">{t('Remember your password?')} <a href="/login" className="text-[#093C5D] font-bold cursor-pointer ml-1 hover:underline">{t('Log in')}</a></span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{t('Forgot Password?')}</h2>
        <p className="text-base text-gray-500 font-medium">
          {t('Enter your email address and we will send you a link to reset your password.')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100/50 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('Email Address')}
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full h-12 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('Send Reset Link')
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">{t('Remember your password?')} <a href="/login" className="text-[#093C5D] font-bold cursor-pointer ml-1 hover:underline">{t('Log in')}</a></span>
      </div>
    </div>
  );
};

export default ForgotPassword;
