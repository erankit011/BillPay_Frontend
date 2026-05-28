import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, User, Mail, Phone, Store, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be a 10-digit number').required('Phone is required'),
  shopName: yup.string().required('Shop name is required'),
  password: yup.string().min(6, 'Must be at least 6 characters').required('Password is required'),
});

const Register = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Personal Info, 2: Business Info, 3: Security
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange'
  });

  const watchedFields = watch();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', data);
      
      if (res.data.success) {
        navigate('/verify-email', {
          state: {
            email: data.email,
            name: data.name
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['name', 'email'];
    } else if (step === 2) {
      fieldsToValidate = ['phone', 'shopName'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  return (
    <div className="animate-fade-in px-2 sm:px-0">
      {/* Progress Steps - Compact Design */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors ${
                step >= s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-8 sm:w-12 h-0.5 transition-colors ${
                  step > s ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-6 sm:gap-8 text-xs text-gray-600">
          <span className={step === 1 ? 'font-semibold text-blue-600' : ''}>Personal</span>
          <span className={step === 2 ? 'font-semibold text-blue-600' : ''}>Business</span>
          <span className={step === 3 ? 'font-semibold text-blue-600' : ''}>Security</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
          <User className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('Create Account')}
        </h2>
        <p className="text-gray-600 text-sm">
          {step === 1 && 'Tell us about yourself'}
          {step === 2 && 'Your business details'}
          {step === 3 && 'Secure your account'}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                {t('Full Name')}
              </label>
              <input 
                {...register('name')}
                className={`w-full rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your full name"
                autoFocus
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                {t('Email Address')}
              </label>
              <input 
                type="email"
                {...register('email')}
                className={`w-full rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <button 
              type="button"
              onClick={handleNext}
              className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {t('Continue')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Store className="w-4 h-4 inline mr-1" />
                {t('Shop Name')}
              </label>
              <input 
                {...register('shopName')}
                className={`w-full rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.shopName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your shop name"
                autoFocus
              />
              {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                {t('Phone Number')}
              </label>
              <input 
                {...register('phone')}
                className={`w-full rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('Back')}
              </button>
              <button 
                type="button"
                onClick={handleNext}
                className="flex-1 flex justify-center items-center py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {t('Continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock className="w-4 h-4 inline mr-1" />
                {t('Password')}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`w-full rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Create a strong password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
              <p className="text-xs font-semibold text-blue-900 mb-2">Account Summary:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <p><strong>Name:</strong> {watchedFields.name || '-'}</p>
                <p><strong>Email:</strong> {watchedFields.email || '-'}</p>
                <p><strong>Shop:</strong> {watchedFields.shopName || '-'}</p>
                <p><strong>Phone:</strong> {watchedFields.phone || '-'}</p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('Back')}
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center items-center py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>{t('Creating...')}</span>
                  </>
                ) : (
                  <span>{t('Create Account')}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('Already have an account?')}{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">
            {t('Sign In')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
