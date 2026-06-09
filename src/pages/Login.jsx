import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const loginSchema = yup.object({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login/verify-password', data);

      if (res.data.success) {
        navigate('/verify-login-otp', {
          state: {
            email: data.email,
            name: res.data.data.name
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 md:px-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1.5 md:mb-2">
          {t('Welcome Back')}
        </h2>
        <p className="text-sm md:text-base text-gray-600 font-medium">
          {t('Sign in to your BakiPay account')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 md:mb-6 text-xs md:text-sm border border-red-200 animate-scale-in text-center font-semibold">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
            {t('Email Address')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="email"
              {...register('email')}
              className={`w-full rounded-xl border-1 border-gray-200 bg-gray-50 pl-10 md:pl-12 pr-4 py-3 md:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors duration-200 outline-none ${errors.email ? 'ring-1 ring-red-500' : ''}`}
              placeholder="your@gmail.com"
              autoFocus
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700 tracking-wide">
              {t('Password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              {t('Forgot Password?')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className={`w-full rounded-xl border-1 border-gray-200 bg-gray-50 pl-10 md:pl-12 pr-11 md:pr-12 py-3 md:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors duration-200 outline-none ${errors.password ? 'ring-1 ring-red-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none active:scale-90"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Eye className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.password.message}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg active:scale-95 transition-all mt-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              <span>{t('Signing In...')}</span>
            </>
          ) : (
            <span>{t('Sign In')}</span>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 md:mt-8 text-center">
        <p className="text-xs md:text-sm text-gray-600 font-medium">
          {t("Don't have an account?")}{' '}
          <Link
            to="/register"
            className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t('Create Account')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
