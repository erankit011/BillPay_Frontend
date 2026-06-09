import { useState, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader2, User, Mail, Phone, Store, Lock, ArrowRight, Eye, EyeOff, Camera } from 'lucide-react';
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
    <div className="w-full max-w-lg mx-auto px-4 md:px-6 animate-fade-in">
      {/* BakiPay Branding */}
      <div className="text-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-indigo-600">BakiPay</h1>
      </div>

      <div className="glass-panel rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
        {/* Progress Steps - Horizontal Layout */}
        <div className="mb-6 md:mb-8 lg:mb-10">
          <div className="flex items-center justify-between max-w-md mx-auto px-2">
            {[1, 2, 3].map((s, idx) => (
              <Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5 md:gap-2">
                  <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-base md:text-lg lg:text-xl font-semibold transition-all ${
                    step >= s 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-[10px] md:text-xs lg:text-sm font-semibold whitespace-nowrap ${
                    step >= s ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {s === 1 ? 'Personal' : s === 2 ? 'Business' : 'Security'}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-0.5 md:h-1 mx-1.5 md:mx-3 rounded-full transition-all ${
                    step > s ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-5 md:mb-6 lg:mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1.5 md:mb-2">
            {t('Create Account')}
          </h2>
          <p className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">
            {step === 1 && 'Tell us about yourself to get started.'}
            {step === 2 && 'Your business details'}
            {step === 3 && 'Secure your account'}
          </p>
        </div>

        {/* Profile Image Upload (Step 1 only) */}
        {step === 1 && (
          <div className="flex justify-center mb-5 md:mb-6 lg:mb-8">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                <User className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
              </div>
              <button
                type="button"
                className="cursor-pointer absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors active:scale-90"
              >
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-2.5 md:p-3 rounded-xl mb-4 md:mb-5 text-xs md:text-sm border border-red-200 animate-scale-in text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input 
                    {...register('name')}
                    className={`w-full rounded-xl border-2 bg-white pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors duration-200 outline-none ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Jane Doe"
                    autoFocus
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input 
                    type="email"
                    {...register('email')}
                    className={`w-full rounded-xl border-2 bg-white pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors duration-200 outline-none ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="jane.doe@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.email.message}</p>}
              </div>

              <button 
                type="button"
                onClick={handleNext}
                className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 md:py-3 lg:py-3.5 rounded-full font-semibold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-6"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Shop Name
                </label>
                <div className="relative">
                  <Store className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input 
                    {...register('shopName')}
                    className={`w-full rounded-xl border-2 bg-white pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors duration-200 outline-none ${errors.shopName ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Enter your shop name"
                    autoFocus
                  />
                </div>
                {errors.shopName && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.shopName.message}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input 
                    {...register('phone')}
                    className={`w-full rounded-xl border-2 bg-white pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors duration-200 outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs md:text-sm mt-1.5 font-semibold">{errors.phone.message}</p>}
              </div>

              <div className="flex gap-2.5 md:gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="cursor-pointer flex-1 py-2.5 md:py-3 lg:py-3.5 px-4 rounded-full text-sm md:text-base font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all"
                >
                  Back
                </button>
                <button 
                  type="button"
                  onClick={handleNext}
                  className="cursor-pointer flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 md:py-3 lg:py-3.5 rounded-full font-semibold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {step === 3 && (
            <div className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    className={`w-full rounded-xl border-2 bg-white pl-10 md:pl-12 pr-11 md:pr-12 py-2.5 md:py-3 lg:py-3.5 text-sm md:text-base text-gray-900 font-medium placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors duration-200 outline-none ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Create a strong password"
                    autoFocus
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
                <p className="text-xs md:text-sm text-gray-500 mt-1.5 font-medium">At least 6 characters</p>
              </div>

              {/* Summary */}
              <div className="bg-indigo-50 rounded-xl p-3 md:p-4 border border-indigo-100">
                <p className="text-xs md:text-sm font-semibold text-indigo-900 mb-2">Account Summary:</p>
                <div className="space-y-1 text-xs md:text-sm text-indigo-800 font-medium">
                  <p className="truncate"><strong>Name:</strong> {watchedFields.name || '-'}</p>
                  <p className="truncate"><strong>Email:</strong> {watchedFields.email || '-'}</p>
                  <p className="truncate"><strong>Shop:</strong> {watchedFields.shopName || '-'}</p>
                  <p className="truncate"><strong>Phone:</strong> {watchedFields.phone || '-'}</p>
                </div>
              </div>

              <div className="flex gap-2.5 md:gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="cursor-pointer flex-1 py-2.5 md:py-3 lg:py-3.5 px-4 rounded-full text-sm md:text-base font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 md:py-3 lg:py-3.5 rounded-full font-semibold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg active:scale-95 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-5 md:mt-6 lg:mt-8 text-center">
          <p className="text-xs md:text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
