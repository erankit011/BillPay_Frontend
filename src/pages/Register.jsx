import { useState, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, User, Mail, Phone, Store, Lock, ArrowRight, Eye, EyeOff, Camera, UserPlus, AlertCircle } from 'lucide-react';
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
  const [step, setStep] = useState(1);
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
    <div className="w-full animate-fade-in text-center lg:text-left">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 tracking-tight">
          {t('Create Account')}
        </h2>
        <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
          {step === 1 && 'Tell us about yourself to get started.'}
          {step === 2 && 'Your business details'}
          {step === 3 && 'Secure your account'}
        </p>
      </div>

      {/* Modern Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs sm:text-sm font-semibold text-[#093C5D]">
               {step === 1 ? 'Personal Info' : step === 2 ? 'Shop Details' : 'Security'}
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-gray-400">
               Step {step} of 3
            </span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          {[1, 2, 3].map((s) => (
            <div 
               key={s} 
               className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden"
            >
               <div 
                 className={`h-full bg-[#093C5D] rounded-full transition-all duration-500 ease-out ${
                   step >= s ? 'w-full' : 'w-0'
                 }`}
               ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Image Upload (Step 1 only) */}
      {step === 1 && (
        <div className="flex mb-6 justify-center lg:justify-start">
          <div className="relative group cursor-pointer">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-300 group-hover:border-[#093C5D] group-hover:bg-[#093C5D]/5 transition-all">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm font-medium border border-red-100/50 animate-scale-in text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
                {t("Full Name")}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
                <input 
                  {...register('name')}
                  className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
                  placeholder="Enter Your Name"
                  autoFocus
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.name.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
                {t("Email Address")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
                <input 
                  type="email"
                  {...register('email')}
                  className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
                  placeholder="Enter Your Email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.email.message}</span>
                </p>
              )}
            </div>

            <button 
              type="button"
              onClick={handleNext}
              className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
            >
              <span>{t("Continue")}</span>
              <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
                {t("Shop Name")}
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
                <input 
                  {...register('shopName')}
                  className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.shopName ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
                  placeholder="Shop Name"
                  autoFocus
                />
              </div>
              {errors.shopName && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.shopName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
                {t("Phone Number")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
                <input 
                  {...register('phone')}
                  className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
                  placeholder="Mobile Number"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.phone.message}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 mt-6">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="cursor-pointer w-full sm:w-1/3 py-2.5 sm:py-3 flex items-center justify-center rounded-full text-sm sm:text-base font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                {t("Back")}
              </button>
              <button 
                type="button"
                onClick={handleNext}
                className="cursor-pointer w-full sm:w-2/3 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{t("Continue")}</span>
                <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 text-left">
                {t("Password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-400 pointer-events-none" />
                <input 
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`w-full rounded-full border bg-white pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 transition-all outline-none ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D]'}`}
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1.5 sm:p-1 rounded-md"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-start gap-1 text-left">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                  <span className="leading-snug">{errors.password.message}</span>
                </p>
              )}
              <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 font-medium text-left">{t("At least 6 characters")}</p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 text-left">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-3 sm:mb-4 uppercase tracking-wider">{t("Account Summary")}</p>
              <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-900 font-medium border-l-2 border-[#093C5D] pl-3 sm:pl-4">
                <div className="flex flex-col"><span className="text-gray-500 text-[10px] sm:text-xs">{t("Name")}</span> <span>{watchedFields.name || '-'}</span></div>
                <div className="flex flex-col"><span className="text-gray-500 text-[10px] sm:text-xs">{t("Email")}</span> <span className="truncate">{watchedFields.email || '-'}</span></div>
                <div className="flex flex-col"><span className="text-gray-500 text-[10px] sm:text-xs">{t("Shop")}</span> <span>{watchedFields.shopName || '-'}</span></div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 mt-6">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="cursor-pointer w-full sm:w-1/3 py-2.5 sm:py-3 flex items-center justify-center rounded-full text-sm sm:text-base font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full sm:w-2/3 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                    <span>{t("Creating...")}</span>
                  </>
                ) : (
                  <span>{t("Create Account")}</span>
                )}
              </button>
            </div>
          </div>
        )}
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

        <a
          href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="mt-4 sm:mt-6 w-full cursor-pointer py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('Continue With Google')}
        </a>
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">{t("Already have an account?")} <Link to="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1 hover:underline">{t("Login Here")}</Link></span>
      </div>
    </div>
  );
};

export default Register;
