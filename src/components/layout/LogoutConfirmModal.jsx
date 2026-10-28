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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4 border border-red-100">
          <LogOut className="w-6 h-6 ml-0.5" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('Logout')}</h3>
        <p className="text-sm font-medium text-gray-500 mb-6">
          {t('Are you sure you want to log out?')}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            {t('Yes, Logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LogoutConfirmModal);

