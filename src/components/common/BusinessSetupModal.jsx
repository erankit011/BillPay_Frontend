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

  /**
   * Body Scroll Lock Controller
   * Freezes document scrolling when modal dialog is active
   */
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
      {/**
       * Backdrop Dimmer Overlay
       * Semi-transparent dark blur background capturing dismiss clicks
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/**
       * Responsive Dialog Container
       * Positions as bottom sheet on mobile viewports and centered modal on desktop
       */}
      <div 
        className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative bg-[#FBFBFC] w-full sm:max-w-md rounded-t-2xl sm:rounded-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden shadow-none">
          
          {/**
           * Mobile Sheet Drag Indicator
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-[#FBFBFC]">
            <div className="w-10 h-1 bg-[#DCE1EA] rounded-full" />
          </div>

          {/**
           * Dialog Header
           * Displays business setup title and dismissal action button
           */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-[#E8ECF2] bg-[#FBFBFC] flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-[#191E2B] flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center shrink-0 shadow-none">
                <Store className="w-5 h-5 text-[#4338CA]" />
              </div>
              <span className="leading-tight">{t('Business Setup Required')}</span>
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-[#DCE1EA] shadow-none"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Dialog Content Body
           * Describes prerequisites and benefits of completing business profile
           */}
          <div className="p-5 md:p-6 text-left space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            <p className="text-xs sm:text-sm font-medium text-[#4E5668] leading-relaxed">
              {t('Before creating your first bill, please set up your shop profile so your invoices have proper business identification and branding.')}
            </p>

            {/**
             * Feature Matrix Card
             * Outlines core merchant capabilities unlocked upon setup completion
             */}
            <div className="bg-[#F0F2F6] rounded-lg p-3.5 sm:p-4 border border-[#DCE1EA] space-y-3.5 shadow-none">
              
              {/**
               * Feature Item 1: Invoice Header Branding
               */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FBFBFC] border border-[#DCE1EA] flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <Receipt className="w-4 h-4 text-[#4338CA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191E2B] leading-snug">
                    {t('Shop Name & Address')}
                  </h4>
                  <p className="text-xs font-medium text-[#757F94] leading-relaxed mt-0.5">
                    {t('Printed cleanly on customer receipts, invoices & PDF downloads')}
                  </p>
                </div>
              </div>

              {/**
               * Feature Item 2: Dynamic UPI QR Generation
               */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FBFBFC] border border-[#DCE1EA] flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <QrCode className="w-4 h-4 text-[#4338CA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191E2B] leading-snug">
                    {t('Custom Payment UPI QR')}
                  </h4>
                  <p className="text-xs font-medium text-[#757F94] leading-relaxed mt-0.5">
                    {t('Customers can scan and pay directly to your shop UPI')}
                  </p>
                </div>
              </div>

              {/**
               * Feature Item 3: Streamlined Onboarding
               */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FBFBFC] border border-[#DCE1EA] flex items-center justify-center shrink-0 mt-0.5 shadow-none">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191E2B] leading-snug">
                    {t('Quick 1-Minute Setup')}
                  </h4>
                  <p className="text-xs font-medium text-[#757F94] leading-relaxed mt-0.5">
                    {t('Pre-filled phone & email — update anytime from Settings')}
                  </p>
                </div>
              </div>

            </div>

            {/**
             * Modal Navigation Actions
             * Offers option to defer setup or proceed to configuration wizard
             */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-[#4E5668] bg-[#FBFBFC] hover:bg-[#EBEEF4] border border-[#DCE1EA] transition-colors cursor-pointer text-center active:scale-[0.98] shadow-none"
              >
                {t('Explore App First')}
              </button>
              <button
                type="button"
                onClick={handleSetupClick}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none"
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
