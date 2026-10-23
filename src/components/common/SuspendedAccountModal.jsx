import React, { useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Mail, LogOut, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SuspendedAccountModal = ({ isOpen, reason, onLogout }) => {
  const { t } = useTranslation();

  // Prevent background scrolling when modal is active
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
      {/* Non-dismissible Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/75 backdrop-blur-sm transition-opacity"
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden z-10 animate-modal-content">
        {/* Top Warning Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        <div className="p-6 sm:p-7 text-left space-y-5">
          {/* Header with Icon */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {t('Store Account Suspended')}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {t('Action Required')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                {t('Your merchant shop account access has been restricted by the platform administration.')}
              </p>
            </div>
          </div>

          {/* Reason Box */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>{t('Suspension Reason')}</span>
            </div>
            <p className="text-sm font-medium text-rose-950 leading-relaxed break-words bg-white/70 p-2.5 rounded-lg border border-rose-100">
              "{displayReason}"
            </p>
          </div>

          {/* Information Notice */}
          <div className="text-xs text-gray-600 leading-relaxed space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
            <p className="font-semibold text-gray-800">
              {t('What does this mean for your store?')}
            </p>
            <p>
              {t('New bill generation, customer ledger updates, and automated reminders are temporarily paused. Your store data remains completely safe and backed up.')}
            </p>
          </div>

          {/* Support Info & Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <a
              href="mailto:support@udharpay.com?subject=Appeal%20Store%20Suspension"
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{t('Contact Support')}</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm hover:shadow"
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
