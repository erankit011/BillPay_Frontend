import React, { useEffect } from 'react';
import { X, Store, ArrowRight, Clock, QrCode, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * BusinessSetupModal Component
 * Prompted whenever an un-onboarded shopkeeper attempts to create bills, invoices, or business-critical actions.
 * Follows strict app theme, no shadows, font-semibold & font-medium typography, and reliable scroll-locking.
 */
const BusinessSetupModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Strictly lock background body and html scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetupClick = () => {
    onClose();
    navigate('/setup-business');
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div 
        className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden shadow-none">
          
          {/* Drag handle for mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-white flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#093C5D] border border-blue-100 flex items-center justify-center shrink-0 shadow-none">
                <Store className="w-5 h-5 text-[#093C5D]" />
              </div>
              <span className="leading-tight">{t('Business Setup Required')}</span>
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 shadow-none"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 md:p-6 text-left space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">
              {t('Before creating your first bill, please set up your shop profile so your invoices have proper business identification and branding.')}
            </p>

            {/* Feature Highlights Card (No Shadow, clean border) */}
            <div className="bg-gray-50/80 rounded-lg p-3.5 sm:p-4 border border-gray-200 space-y-3.5 shadow-none">
              
              {/* Item 1: Shop details on receipts */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <Receipt className="w-4 h-4 text-[#093C5D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                    {t('Shop Name & Address')}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mt-0.5">
                    {t('Printed cleanly on customer receipts, invoices & PDF downloads')}
                  </p>
                </div>
              </div>

              {/* Item 2: Custom payment QR */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <QrCode className="w-4 h-4 text-[#093C5D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                    {t('Custom Payment UPI QR')}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mt-0.5">
                    {t('Customers can scan and pay directly to your shop UPI')}
                  </p>
                </div>
              </div>

              {/* Item 3: Quick 1-minute setup */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                    {t('Quick 1-Minute Setup')}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mt-0.5">
                    {t('Pre-filled phone & email — update anytime from Settings')}
                  </p>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-colors cursor-pointer text-center active:scale-[0.98] shadow-none"
              >
                {t('Explore App First')}
              </button>
              <button
                type="button"
                onClick={handleSetupClick}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#093C5D] hover:bg-[#082a42] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none"
              >
                <span>{t('Set Up Business')}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BusinessSetupModal;
