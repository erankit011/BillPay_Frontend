import React from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, BUILD_DATE } from '../../constants/appVersion';

/**
 * AppVersionCard - Reusable, theme-aligned application version widget
 * Clean, symmetrical layout without icons or status pills
 * 
 * @param {string} variant - 'sidebar' (compact for desktop nav rails) | 'full' (responsive banner for mobile/tablet)
 * @param {string} className - Optional container CSS overrides
 */
const AppVersionCard = ({ variant = 'sidebar', className = '' }) => {
  const { t } = useTranslation();

  if (variant === 'full') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200/80 p-4 shadow-none ${className}`}>
        {/* Top Row: App Name + Version */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-tight leading-none">
              UdharPay
            </h4>
            <p className="text-xs text-gray-500 font-normal mt-1 leading-none">
              Billing & Recovery
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-500 select-none">
            v{APP_VERSION}
          </span>
        </div>

        {/* Bottom Row: Release Date */}
        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100">
          <span className="text-gray-500 font-normal">{t('Release Date')}</span>
          <span className="text-gray-700 font-medium">{BUILD_DATE}</span>
        </div>
      </div>
    );
  }

  // Default: 'sidebar' variant for desktop sticky navigation rails
  return (
    <div className={`bg-white rounded-lg border border-gray-200/80 p-3.5 shadow-none transition-colors duration-150 ${className}`}>
      {/* Top Row: App Name + Version */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-gray-900 tracking-tight leading-none">
            UdharPay
          </h4>
          <p className="text-[10px] text-gray-500 font-normal mt-1 leading-none">
            Billing & Recovery
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-gray-500 select-none">
          v{APP_VERSION}
        </span>
      </div>

      {/* Bottom Row: Release Date */}
      <div className="flex items-center justify-between text-[10.5px] mt-2.5 pt-2.5 border-t border-gray-100">
        <span className="text-gray-500 font-normal">{t('Release Date')}</span>
        <span className="text-gray-700 font-medium">{BUILD_DATE}</span>
      </div>
    </div>
  );
};

export default AppVersionCard;
