/**
 * Administrative Store Suspension & Reactivation Modal
 * Manages store lockdown with reason logging, real-time WebSocket disconnection, and instant reactivation.
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * Common Preset Suspension Reasons
 */
const COMMON_REASONS = [
  'Payment Default / Unpaid Dues',
  'Policy Violation / Terms Breach',
  'Suspicious Activity / Fraud Risk',
  'Requested by Merchant / Inactive',
];

const SuspendShopModal = ({ isOpen, onClose, shop, onConfirm, isLoading }) => {
  const [reason, setReason] = useState('');
  const isSuspended = Boolean(shop?.isSuspended);

  /**
   * Modal State & Scroll Lock Synchronization
   * Resets reason input on open and locks viewport scrolling and touch gestures.
   */
  useEffect(() => {
    if (!isOpen) return;

    setReason('');
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
  }, [isOpen, shop]);

  if (!isOpen || !shop) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      isSuspended: !isSuspended,
      reason: !isSuspended ? (reason.trim() || 'Suspended by system administrator') : '',
    });
  };

  const shopDisplayName = shop.businessName || shop.name || 'Merchant Shop';

  return (
    <div className="fixed inset-0 z-[60] overscroll-contain">
      {/**
       * Backdrop Overlay
       * Darkened semi-transparent overlay blocking interaction with background.
       */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Modal Container Shell
       * Renders as responsive bottom drawer on mobile and centered dialog on sm+ screens.
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">
          
          {/**
           * Mobile Drag Affordance Handle
           * Visual indicator for touch gestures on mobile devices.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/**
           * Modal Header Toolbar
           * Shows status badge icon, dialog title, merchant name, and dismiss button.
           */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSuspended
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isSuspended ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate">
                  {isSuspended ? 'Unsuspend Shop Account' : 'Suspend Shop Account'}
                </h3>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  {shopDisplayName} {shop.email && `• ${shop.email}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 ml-auto"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Modal Form Body
           * Houses suspension warning notice, preset reasons, and detailed text input.
           */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              
              {!isSuspended ? (
                <>
                  {/**
                   * Warning Callout Banner
                   * Explains session revocation and instant merchant lockout implications.
                   */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 font-medium leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Suspending this account will immediately revoke all active sessions, disconnect sockets, and block billing and customer access.
                    </span>
                  </div>

                  {/**
                   * Common Reason Quick-Select Chips
                   * Fast-selection badges for common violation categories.
                   */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Select Common Reason
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {COMMON_REASONS.map((opt) => {
                        const isSelected = reason === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setReason(opt)}
                            className={`cursor-pointer px-2.5 py-1.5 text-left text-[11px] sm:text-xs font-medium rounded-lg border transition-all active:scale-95 truncate ${
                              isSelected
                                ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200 font-semibold'
                                : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                            title={opt}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/**
                   * Custom Reason Textarea
                   * Detailed notes entered by admin and displayed in audit logs.
                   */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reason Details (Visible in logs & support)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Select an option above or enter custom reason..."
                      className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] shadow-none resize-none"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium leading-relaxed">
                    Unsuspending this shop will immediately restore full portal access and permit the merchant to resume billing transactions.
                  </div>

                  {shop.suspendedReason && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <span className="text-gray-500 font-medium block text-[11px] uppercase tracking-wider mb-0.5">
                        Previous Suspension Reason
                      </span>
                      <span className="font-semibold text-gray-800">
                        {shop.suspendedReason}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/**
             * Modal Action Footer Controls
             * Confirms or cancels suspension status toggle with loading feedback.
             */}
            <div className="px-4 sm:px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors active:scale-95 inline-flex items-center justify-center flex-1 sm:flex-initial"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`cursor-pointer h-10 px-5 text-xs sm:text-sm font-semibold rounded-lg text-white shadow-none transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  isSuspended
                    ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600'
                    : 'bg-rose-600 hover:bg-rose-700 border border-rose-600'
                }`}
              >
                {isSuspended ? (
                  <>
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{isLoading ? 'Unsuspending...' : 'Confirm Unsuspend'}</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{isLoading ? 'Suspending...' : 'Confirm Suspension'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuspendShopModal;
