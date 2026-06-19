import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2 tracking-tight">
          {t('Sign In')}
        </h2>
        <p className="text-gray-500 font-medium">
          {t('Please enter your details to sign in.')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100/50 animate-scale-in">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('Email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="email"
              {...register('email')}
              className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your email"
              autoFocus
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('Password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              {...register('password')}
              className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-12 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1 rounded-md active:scale-95"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-start justify-between mt-2">
            {errors.password ? (
              <p className="text-red-500 text-sm font-medium">{errors.password.message}</p>
            ) : (
              <div></div>
            )}
            <Link
              to="/forgot-password"
              className="text-sm underline font-semibold text-[#093C5D] hover:text-[#072C44] transition-colors cursor-pointer ml-auto"
            >
              {t('Forgot password?')}
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full h-12 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('Signing in...')}</span>
            </>
          ) : (
            <span>{t('Sign in')}</span>
          )}
        </button>
      </form>

      {/* Social Auth */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-medium">{t('Or continue with')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="mt-6 w-full cursor-pointer h-12 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue With Google
        </button>

        {/* Bottom Actions */}
        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500 font-medium">{t('Don’t have an account?')} <Link to="/register" className="text-[#093C5D] font-semibold cursor-pointer ml-1 underline">{t('Sign Up')}</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
