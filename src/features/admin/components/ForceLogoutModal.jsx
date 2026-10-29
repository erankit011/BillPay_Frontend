/**
 * Administrative Force Remote Logout Confirmation Modal
 * Terminates all active JWT credentials and WebSocket sessions for a merchant across devices.
 */

import React, { useEffect } from 'react';
import { LogOut, AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * ForceLogoutModal Component
 */
const ForceLogoutModal = ({
  isOpen,
  onClose,
  shop,
  isLoading,
  onConfirm
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  /**
   * Scroll & Touch Lock Hook
   * Disables document scrolling and touch moves while modal confirmation is open.
   */
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !shop) return null;

  const shopName = shop.businessName || shop.name || 'this shop';
  const ownerName = shop.name && shop.businessName && shop.name !== shop.businessName ? shop.name : null;

  return (
    <div className="fixed inset-0 z-[100] overscroll-contain">
      {/**
       * Backdrop Overlay
       * Darkened modal background dismissing confirmation view on backdrop tap.
       */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain z-[100]"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Centered Modal Dialog Card
       * Compact alert card confirming session revocation.
       */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/**
           * Close Action Button
           * Circular button to cancel force logout action.
           */}
          <div className="absolute top-3.5 right-3.5 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 disabled:opacity-50"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="p-5 sm:p-6 text-center">
            {/**
             * Security Alert Badge
             * Crimson round pill with logout icon indicating destructive session termination.
             */}
            <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
              <LogOut className="w-6 h-6 text-red-600 ml-0.5" />
            </div>

            {/**
             * Dialog Headline
             * Plain confirmation title banner.
             */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Force Logout Shopkeeper
            </h3>

            {/**
             * Action Impact Description
             * Explains that all active sessions will be terminated immediately across devices.
             */}
            <p className="text-gray-500 text-sm mb-4 font-medium leading-relaxed">
              Are you sure you want to forcibly log out{' '}
              <span className="font-semibold text-gray-800">{shopName}</span>
              {ownerName ? <span className="text-gray-500 font-normal"> ({ownerName})</span> : ''}?
              All active sessions across all devices will be terminated immediately.
            </p>

            {/**
             * Security Impact Notice
             * Crimson callout noting that merchant re-authentication will be enforced.
             */}
            <div className="bg-red-50/70 border border-red-100 rounded-lg p-2.5 text-xs text-red-700 text-left mb-6 space-y-0.5">
              <div className="flex items-center gap-1.5 font-medium text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Security Notice</span>
              </div>
              <p className="text-red-600/90 text-[11px] leading-normal font-normal pl-5">
                The merchant will be required to re-authenticate with their credentials to access their store again.
              </p>
            </div>

            {/**
             * Modal Action Footer
             * Cancel button and destructive force-logout trigger with loading feedback.
             */}
            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold text-xs sm:text-[13px] transition-colors active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(shop._id || shop)}
                disabled={isLoading}
                className="cursor-pointer flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs sm:text-[13px] transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? 'Revoking...' : 'Yes, Force Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceLogoutModal;
