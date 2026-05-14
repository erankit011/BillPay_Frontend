import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../redux/slices/authSlice';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const loginSchema = yup.object({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be a 10-digit number').required('Phone is required'),
  shopName: yup.string().required('Shop name is required'),
  password: yup.string().min(6, 'Must be at least 6 characters').required('Password is required'),
});

const Login = ({ isRegister = false }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = isRegister ? registerSchema : loginSchema;
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await api.post(endpoint, data);
      
      if (res.data.success) {
        dispatch(loginSuccess({
          user: res.data.data,
          token: res.data.data.token
        }));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {isRegister ? t('Create an Account') : t('Sign in to your account')}
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Full Name')}</label>
              <input 
                {...register('name')}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Shop Name')}</label>
              <input 
                {...register('shopName')}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.shopName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter shop name"
              />
              {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Phone Number')}</label>
              <input 
                {...register('phone')}
                className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="10-digit number"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email Address')}</label>
          <input 
            type="email"
            {...register('email')}
            className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('Password')}</label>
          <input 
            type="password"
            {...register('password')}
            className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 btn-hover-lift transition-all"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? t('Sign Up') : t('Sign In'))}
        </button>
      </form>

      <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
        {isRegister ? (
          <p className="text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">{t('Sign In')}</Link>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">{t('Sign Up')}</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
