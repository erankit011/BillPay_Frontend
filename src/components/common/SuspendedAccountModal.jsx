/**
 * Merchant Account Suspension Notice Modal
 * Non-dismissible security overlay displayed in real time when an administrator suspends a shop.
 */

import React, { useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Mail, LogOut, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * SuspendedAccountModal Component
 */
const SuspendedAccountModal = ({ isOpen, reason, onLogout }) => {
  const { t } = useTranslation();

  /**
   * Body Scroll Lock Controller
   * Prevents window scroll manipulation while suspension modal is displayed
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

  if (!isOpen) return null;

  const displayReason = reason?.trim() || t('Administrative review or terms of service compliance.');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overscroll-contain animate-fade-in">
      {/**
       * Non-Dismissible Dark Backdrop
       * Blocks user interaction with underlying workspace
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/60 backdrop-blur-xs transition-opacity"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Suspension Notice Card
       * Central dialog window presenting administrative reason and appeals route
       */}
      <div className="relative w-full max-w-lg bg-[#FBFBFC] rounded-2xl shadow-none border border-[#DCE1EA] overflow-hidden z-10 animate-modal-content">
        {/**
         * Warning Color Accent Bar
         */}
        <div className="h-1.5 w-full bg-[#B91C1C]" />

        <div className="p-6 sm:p-7 text-left space-y-5">
          {/**
           * Dialog Heading & Severity Badge
           */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-[#FDF2F2] border border-[#F9D4D4] text-[#B91C1C] flex items-center justify-center shadow-none">
                <ShieldAlert className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F87171] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#B91C1C] border-2 border-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-[#191E2B] tracking-tight">
                  {t('Store Account Suspended')}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FDF2F2] text-[#B91C1C] border border-[#F9D4D4]">
                  {t('Action Required')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#757F94] mt-1 leading-relaxed">
                {t('Your merchant shop account access has been restricted by the platform administration.')}
              </p>
            </div>
          </div>

          {/**
           * Administrative Reason Box
           * Surfaces specific suspension reasoning recorded by system operators
           */}
          <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#F9D4D4] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>{t('Suspension Reason')}</span>
            </div>
            <p className="text-sm font-medium text-[#191E2B] leading-relaxed break-words bg-[#FBFBFC] p-2.5 rounded-lg border border-[#F9D4D4]">
              "{displayReason}"
            </p>
          </div>

          {/**
           * Operational Impact Clarification
           * Informs merchant that tenant database assets remain intact
           */}
          <div className="text-xs text-[#4E5668] leading-relaxed space-y-1 bg-[#F0F2F6] p-3.5 rounded-xl border border-[#DCE1EA]">
            <p className="font-semibold text-[#191E2B]">
              {t('What does this mean for your store?')}
            </p>
            <p>
              {t('New bill generation, customer ledger updates, and automated reminders are temporarily paused. Your store data remains completely safe and backed up.')}
            </p>
          </div>

          {/**
           * Support Escalation & Logout Actions
           */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <a
              href="mailto:support@udharpay.com?subject=Appeal%20Store%20Suspension"
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE1EA] text-[#4E5668] bg-[#FBFBFC] hover:bg-[#F0F2F6] hover:text-[#191E2B] text-xs sm:text-sm font-semibold transition-colors shadow-none active:scale-95"
            >
              <Mail className="w-4 h-4 text-[#757F94]" />
              <span>{t('Contact Support')}</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs sm:text-sm font-semibold transition-colors shadow-none active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('Sign Out Securely')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendedAccountModal;
