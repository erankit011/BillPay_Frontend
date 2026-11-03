import React from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Logout confirmation modal dialog
 */
const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/**
       * Modal Backdrop Overlay
       * Obscures background contents and captures dismiss click events
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 backdrop-blur-xs transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/**
       * Dialog Window Container
       * Prompts user confirmation to invalidate session and log out
       */}
      <div className="relative bg-[#FBFBFC] rounded-2xl shadow-none w-full max-w-sm p-6 text-center z-10 border border-[#DCE1EA] animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#B91C1C] mx-auto flex items-center justify-center mb-4 border border-[#FECDD3]">
          <LogOut className="w-6 h-6 ml-0.5" />
        </div>
        <h3 className="text-lg font-semibold text-[#191E2B] mb-1">{t('Logout')}</h3>
        <p className="text-sm font-medium text-[#4E5668] mb-6">
          {t('Are you sure you want to log out?')}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#F0F2F6] hover:bg-[#E8ECF2] text-[#4E5668] border border-[#DCE1EA] rounded-lg font-semibold text-sm transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
          >
            {t('Yes, Logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LogoutConfirmModal);

