/**
 * Offline / Server Unreachable Error Fallback Screen
 * Displayed when initial network handshake fails or the backend service is offline.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ServerUnreachable Component
 */
const ServerUnreachable = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#F0F2F6] text-center p-4 sm:p-6">
      <div className="bg-[#FBFBFC] p-6 sm:p-8 rounded-2xl border border-[#DCE1EA] max-w-sm sm:max-w-md w-full flex flex-col items-center shadow-none">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FDF2F2] border border-[#F9D4D4] rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#B91C1C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#191E2B] mb-2 sm:mb-3">{t('Server Unreachable')}</h2>
        <p className="text-[#757F94] font-medium text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
          {t("We couldn't connect to our servers. Please check your internet connection or the server might be restarting.")}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-none"
        >
          {t('Retry Connection')}
        </button>
      </div>
    </div>
  );
};

export default ServerUnreachable;
