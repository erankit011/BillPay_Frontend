/**
 * Universal Confirmation Modal Component (Enterprise DRY Architecture)
 * Provides accessible, responsive dialogs for destructive, logout, and warning actions.
 * Conforms to Senior UI/UX light theme standards with solid alpha backdrop (no blur) and body scroll-lock.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';

/**
 * ConfirmModal Component
 * 
 * @param {boolean} isOpen - Whether modal dialog is visible
 * @param {function} onClose - Callback invoked to dismiss dialog
 * @param {function} onConfirm - Callback invoked to execute confirmed action
 * @param {string} title - Dialog header title
 * @param {string} message - Primary confirmation message body
 * @param {string} [itemName] - Optional entity name rendered with strong emphasis
 * @param {string} [confirmText] - Label for affirmative action button
 * @param {string} [cancelText] - Label for cancel/dismiss action button
 * @param {boolean} [isLoading=false] - Whether confirmation mutation is in flight
 * @param {'danger'|'logout'|'warning'|'primary'} [variant='danger'] - Visual theme preset
 * @param {React.ReactNode} [children] - Optional custom body elements
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText,
  cancelText,
  isLoading = false,
  variant = 'danger',
  children
}) => {
  const { t } = useTranslation();

  const isLoadingRef = React.useRef(isLoading);
  isLoadingRef.current = isLoading;
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Scroll Lock & Escape Key Management
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoadingRef.current && onCloseRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset Configurations by Variant
  const variantStyles = {
    danger: {
      confirmButton: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
      defaultConfirmText: t('Yes, Delete')
    },
    logout: {
      confirmButton: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
      defaultConfirmText: t('Yes, Logout')
    },
    warning: {
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
      defaultConfirmText: t('Confirm')
    },
    success: {
      confirmButton: 'bg-[#0D7A57] hover:bg-[#065F46] text-white',
      defaultConfirmText: t('Confirm')
    },
    primary: {
      confirmButton: 'bg-[#4338CA] hover:bg-[#3730A3] text-white',
      defaultConfirmText: t('Confirm')
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.danger;
  const resolvedConfirmText = confirmText || currentVariant.defaultConfirmText;
  const resolvedCancelText = cancelText || t('Cancel');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[120] overscroll-contain"
    >
      {/**
       * Backdrop Overlay
       * Darkened semi-transparent overlay with pure alpha (zero blur)
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/**
       * Responsive Modal Positioning
       * Bottom sheet on mobile devices transitioning to centered dialog on desktop.
       */}
      <div
        className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[120] pointer-events-none"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) onClose();
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
              id="confirm-modal-title"
              className="text-base sm:text-lg font-semibold text-[#191E2B] leading-tight flex items-center gap-2"
            >
              {title}
            </h3>

            {/**
             * Close Modal Action Button
             */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA] shadow-none disabled:opacity-50"
              aria-label={t('Close modal')}
              title={t('Close')}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Modal Body
           * Displays message, highlighted entity reference, and optional children
           */}
          <div className="p-5 text-left bg-[#FBFBFC] space-y-3">
            {message && (
              <p className="text-xs sm:text-sm font-medium text-[#4E5668] leading-relaxed">
                {message}
                {itemName && (
                  <>
                    {' '}
                    <span className="font-semibold text-[#191E2B] break-words">
                      "{itemName}"
                    </span>
                    ?
                  </>
                )}
              </p>
            )}

            {children}
          </div>

          {/**
           * Modal Action Footer
           * Controls for cancelling or committing the action immediately
           */}
          <div className="p-4 sm:p-5 border-t border-[#E8ECF2] bg-[#F0F2F6] flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-[#4E5668] bg-[#FBFBFC] hover:bg-[#EBEEF4] hover:text-[#191E2B] border border-[#DCE1EA] transition-colors cursor-pointer text-center active:scale-[0.98] shadow-none disabled:opacity-50"
            >
              {resolvedCancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm ${currentVariant.confirmButton} transition-colors cursor-pointer text-center active:scale-[0.98] flex items-center justify-center gap-2 shadow-none disabled:opacity-50`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />}
              <span>{isLoading ? t('Processing...') : resolvedConfirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConfirmModal);

