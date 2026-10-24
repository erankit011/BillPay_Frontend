import React from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, BUILD_DATE } from '../../constants/appVersion';
import { usePWAUpdate } from '../../features/pwa';
import SwirlingLoader from './SwirlingLoader';

/**
 * AppVersionCard - Reusable, theme-aligned application version widget
 * Clean, symmetrical layout with tactile badge-styled update check trigger
 * 
 * @param {string} variant - 'sidebar' (compact for desktop nav rails) | 'full' (responsive banner for mobile/tablet)
 * @param {string} className - Optional container CSS overrides
 */
const AppVersionCard = ({ variant = 'sidebar', className = '' }) => {
  const { t } = useTranslation();
  const { checkForUpdates, isChecking } = usePWAUpdate();

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

        {/* Bottom Row: Release Date & Check for Updates */}
        <div className="flex items-center justify-between gap-3 text-xs mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 font-normal">
            <span>{t('Release')}:</span>
            <span className="text-gray-700 font-medium">{BUILD_DATE}</span>
          </div>
          <button
            type="button"
            onClick={() => checkForUpdates()}
            disabled={isChecking}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#093C5D] hover:text-[#082a42] hover:underline transition-colors active:scale-95 disabled:opacity-50 select-none"
            title={t('Check For Update')}
          >
            {isChecking ? (
              <SwirlingLoader className="w-5 h-5 text-[#093C5D] -my-1 shrink-0" strokeWidth={75} />
            ) : (
              <RotateCw className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isChecking ? t('Checking...') : t('Check For Update')}</span>
          </button>
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

      {/* Bottom Row: Release Date & Check for Updates */}
      <div className="flex items-center justify-between gap-2 text-[10.5px] mt-2.5 pt-2.5 border-t border-gray-100">
        <span className="text-gray-500 font-normal truncate">{BUILD_DATE}</span>
        <button
          type="button"
          onClick={() => checkForUpdates()}
          disabled={isChecking}
          className="cursor-pointer inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#093C5D] hover:text-[#082a42] hover:underline transition-colors active:scale-95 disabled:opacity-50 select-none shrink-0"
          title={t('Check For Update')}
        >
          {isChecking ? (
            <SwirlingLoader className="w-4.5 h-4.5 text-[#093C5D] -my-1 shrink-0" strokeWidth={75} />
          ) : (
            <RotateCw className="w-3 h-3 shrink-0" />
          )}
          <span>{isChecking ? t('Checking...') : t('Check For Update')}</span>
        </button>
      </div>
    </div>
  );
};

export default AppVersionCard;
