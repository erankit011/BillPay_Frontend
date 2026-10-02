import React from 'react';
import { X, Lock, Crown, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, title, message }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay" onClick={onClose} />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-modal-content overflow-hidden pointer-events-auto">
          
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-red-50/50">
            <div className="w-10 h-1.5 bg-red-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-red-100 bg-red-50/50 flex-shrink-0">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" /> {title || t('Limit Reached')}
            </h3>
            <button 
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 md:p-6 text-left space-y-5 md:space-y-6 overflow-y-auto flex-1">
            <p className="text-[13px] sm:text-sm text-gray-700 font-medium leading-relaxed">
              {message}
            </p>

            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3 items-start">
              <Crown className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-[13px] sm:text-sm mb-0.5">{t('Unlock Unlimited Access')}</h4>
                <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                  {t('Upgrade your plan to remove all limits and get access to premium features.')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 sm:pt-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-[13px] sm:text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                {t('Maybe Later')}
              </button>
              <button
                onClick={handleUpgradeClick}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-[13px] sm:text-sm text-white bg-[#093C5D] hover:bg-[#082a42] transition-colors flex items-center justify-center gap-2"
              >
                {t('View Plans')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
