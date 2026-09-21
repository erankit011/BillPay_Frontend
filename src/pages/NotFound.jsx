import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 max-w-sm sm:max-w-md w-full flex flex-col items-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">{t('Page Not Found')}</h2>
        
        <p className="text-gray-500 font-medium text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
          {t("The page you are looking for doesn't exist or has been moved.")}
        </p>
        
        <button 
          onClick={() => navigate('/')} 
          className="w-full bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          {t('Go to Homepage')}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
