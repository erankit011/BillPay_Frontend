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
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2 tracking-tight">
          {t('Create Account')}
        </h2>
        <p className="text-base text-gray-500 font-medium">
          {step === 1 && 'Tell us about yourself to get started.'}
          {step === 2 && 'Your business details'}
          {step === 3 && 'Secure your account'}
        </p>
      </div>

      {/* Modern Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-semibold text-[#093C5D]">
               {step === 1 ? 'Personal Info' : step === 2 ? 'Shop Details' : 'Security'}
            </span>
            <span className="text-x font-medium text-gray-400">
               Step {step} of 3
            </span>
        </div>
        <div className="flex gap-5">
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
        <div className="flex mb-8 mt-5 justify-center sm:justify-start">
          <div className="relative group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-300 group-hover:border-[#093C5D] group-hover:bg-[#093C5D]/5 transition-all">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100/50 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input 
                  {...register('name')}
                  className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Jane Doe"
                  autoFocus
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-2 font-medium">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input 
                  type="email"
                  {...register('email')}
                  className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="jane.doe@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email.message}</p>}
            </div>

            <button 
              type="button"
              onClick={handleNext}
              className="cursor-pointer w-full h-12 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-8"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shop Name
              </label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input 
                  {...register('shopName')}
                  className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.shopName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your shop name"
                  autoFocus
                />
              </div>
              {errors.shopName && <p className="text-red-500 text-sm mt-2 font-medium">{errors.shopName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input 
                  {...register('phone')}
                  className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-2 font-medium">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="cursor-pointer w-full sm:w-1/3 h-12 flex items-center justify-center rounded-full text-base font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleNext}
                className="cursor-pointer w-full sm:w-2/3 h-12 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input 
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`w-full rounded-full border border-gray-300 bg-white pl-12 pr-12 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#093C5D] focus:ring-1 focus:ring-[#093C5D] transition-all outline-none ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Create a strong password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1 rounded-md"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-2 font-medium">{errors.password.message}</p>}
              <p className="text-sm text-gray-500 mt-2 font-medium">At least 6 characters</p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Account Summary</p>
              <div className="space-y-3 text-sm text-gray-900 font-medium border-l-2 border-[#093C5D] pl-4">
                <div className="flex flex-col"><span className="text-gray-500 text-xs">Name</span> <span>{watchedFields.name || '-'}</span></div>
                <div className="flex flex-col"><span className="text-gray-500 text-xs">Email</span> <span className="truncate">{watchedFields.email || '-'}</span></div>
                <div className="flex flex-col"><span className="text-gray-500 text-xs">Shop</span> <span>{watchedFields.shopName || '-'}</span></div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="cursor-pointer w-full sm:w-1/3 h-12 flex items-center justify-center rounded-full text-base font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full sm:w-2/3 h-12 bg-[#093C5D] hover:bg-[#072C44] text-white rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
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

      {/* Bottom Actions */}
      <div className="mt-8 text-center text-sm">
        <span className="text-gray-500 font-medium">Already have an account? <a href="/login" className="text-[#093C5D] font-semibold cursor-pointer ml-1 underline">Login Here</a></span>
      </div>
    </div>
  );
};

export default Register;
