import React, { useEffect } from 'react';
import { RotateCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAUpdate } from '../context/PWAContext';
import SwirlingLoader from '../../../components/common/SwirlingLoader';

/**
 * UpdatePromptModal - Optimized, clean in-app update modal
 * Minimalist, centered, uncluttered design adhering to UdharPay UI standards and DRY rule.
 */
const UpdatePromptModal = () => {
  const { t } = useTranslation();
  const { needRefresh, updateApp, dismissUpdate, isUpdating, availableVersion } = usePWAUpdate();

  /**
   * Keyboard Navigation Hook
   * Listens for Escape key presses to dismiss update prompt when not actively updating.
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isUpdating) {
        dismissUpdate();
      }
    };
    if (needRefresh) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [needRefresh, isUpdating, dismissUpdate]);

  /**
   * Scroll Lock Effect
   * Disables background viewport scrolling while the update prompt modal is open.
   */
  useEffect(() => {
    if (!needRefresh) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [needRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-update-modal-title"
      className="fixed inset-0 z-[120] overscroll-contain"
    >
      {/**
       * Backdrop Overlay
       * Darkened semi-transparent overlay triggering prompt dismissal on backdrop tap.
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={() => {
          if (!isUpdating) dismissUpdate();
        }}
      />

      {/**
       * Responsive Modal Positioning
       * Bottom sheet on mobile devices transitioning to centered dialog on desktop.
       */}
      <div
        className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[120] pointer-events-none"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isUpdating) dismissUpdate();
        }}
      >
        <div
          className="relative bg-[#FBFBFC] w-full sm:max-w-[400px] rounded-t-2xl sm:rounded-xl flex flex-col border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/**
           * Mobile Drag Handle
           * Subtle visual indicator pill rendered exclusively on mobile views.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-[#FBFBFC]">
            <div className="w-10 h-1 bg-[#DCE1EA] rounded-full" />
          </div>

          {/**
           * Modal Header
           * Direct title banner with clean typography and circular dismiss button.
           */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF2] bg-[#FBFBFC] flex-shrink-0">
            <h3
              id="pwa-update-modal-title"
              className="text-base sm:text-lg font-semibold text-[#191E2B] leading-tight"
            >
              {t('New Update Available')}
            </h3>

            {/**
             * Close Modal Action Button
             * Dismisses the prompt and maintains standard icon sizing.
             */}
            <button
              type="button"
              onClick={dismissUpdate}
              disabled={isUpdating}
              className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA] shadow-none disabled:opacity-50"
              aria-label={t('Close modal')}
              title={t('Close')}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Notification Body
           * Direct user message announcing availability of modern release version.
           */}
          <div className="p-5 text-left bg-[#FBFBFC]">
            <p className="text-xs sm:text-sm font-medium text-[#4E5668] leading-relaxed">
              {availableVersion
                ? t(`UdharPay v{{version}} is ready to install. Update now to experience new features and improvements.`, { version: availableVersion })
                : t('A new version of UdharPay is ready to install. Update now to experience new features and improvements.')}
            </p>
          </div>

          {/**
           * Modal Action Footer
           * Controls for postponing or executing the application update immediately.
           */}
          <div className="p-4 sm:p-5 border-t border-[#E8ECF2] bg-[#F0F2F6] flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={dismissUpdate}
              disabled={isUpdating}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-[#4E5668] bg-[#FBFBFC] hover:bg-[#EBEEF4] hover:text-[#191E2B] border border-[#DCE1EA] transition-colors cursor-pointer text-center active:scale-[0.98] shadow-none disabled:opacity-50"
            >
              {t('Maybe Later')}
            </button>
            <button
              type="button"
              onClick={updateApp}
              disabled={isUpdating}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#4338CA] hover:bg-[#3730A3] transition-colors cursor-pointer text-center active:scale-[0.98] flex items-center justify-center gap-2 shadow-none disabled:opacity-50"
            >
              {isUpdating ? (
                <SwirlingLoader className="w-6 h-6 text-white -my-1 shrink-0" strokeWidth={75} />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              <span>{isUpdating ? t('Updating...') : t('Update Now')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePromptModal;
