import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, Key } from 'lucide-react';
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
      <div className="w-full animate-fade-in text-center lg:text-left">
        <div className="mb-6">
          <div className="w-12 h-12 bg-[#2ECC71]/10 rounded-xl flex items-center justify-center mb-4 mx-auto lg:mx-0">
            <CheckCircle2 className="w-6 h-6 text-[#2ECC71]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">{t('Check Your Email')}</h2>
          <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
            {t('We have sent a password reset link to')} <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 mb-6 text-left">
          <p className="text-blue-800 text-xs sm:text-sm leading-relaxed font-medium">
            📧 {t('Please check your inbox and click the reset link. The link will expire in 10 minutes.')}
          </p>
        </div>

        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
          <span className="text-gray-500 font-medium">{t('Remember your password?')} <a href="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1 hover:underline">{t('Login Here')}</a></span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in text-center lg:text-left">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">{t('Forgot Password?')}</h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Enter your email address and we will send you a link to reset your password.')}
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
            {t('Email Address')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]"
              placeholder="Enter Your Email"
              required
            />
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
            t('Send Reset Link')
          )}
        </button>
      </form>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">{t('Remember your password?')} <a href="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1 hover:underline">{t('Login Here')}</a></span>
      </div>
    </div>
  );
};

export default ForgotPassword;
