import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
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
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">
          {t('Sign In')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {t('Please enter your details to sign in.')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm font-medium border border-red-100/50 animate-scale-in text-left">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
            {t('Email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
              placeholder="Enter Your Email"
              autoFocus
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
            {t('Password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1.5 sm:p-1 rounded-md active:scale-95"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-4 sm:h-4" />
              ) : (
                <Eye className="w-4 h-4 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
          <div className="flex items-start justify-between mt-1.5">
            {errors.password ? (
              <p className="text-red-500 text-xs sm:text-sm font-medium">{errors.password.message}</p>
            ) : (
              <div></div>
            )}
            <Link
              to="/forgot-password"
              className="text-[11px] sm:text-xs underline font-semibold text-[#093C5D] hover:text-[#072C44] transition-colors cursor-pointer ml-auto"
            >
              {t('Forgot password?')}
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white rounded-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
              <span>{t('Signing in...')}</span>
            </>
          ) : (
            <span>{t('Sign in')}</span>
          )}
        </button>
      </form>

      {/* Social Auth */}
      <div className="mt-6 sm:mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[11px] sm:text-xs">
            <span className="px-2 bg-white text-gray-500 font-medium">{t('Or continue with')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="mt-4 sm:mt-6 w-full cursor-pointer py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue With Google
        </button>

        {/* Bottom Actions */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
          <span className="text-gray-500 font-medium">{t('Don’t have an account?')} <Link to="/register" className="text-[#093C5D] font-semibold cursor-pointer ml-1 hover:underline">{t('Sign Up')}</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
