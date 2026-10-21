import React, { useEffect } from 'react';
import {
  X,
  Store,
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  IndianRupee,
  LogOut,
  Crown
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';

const ShopDetailsModal = ({
  isOpen,
  onClose,
  shop,
  onOpenSuspendModal,
  onOpenPlanModal,
  onForceLogout,
}) => {
  // Prevent background scrolling when modal is open
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

  const isSuspended = Boolean(shop.isSuspended);
  const plan = (shop.subscriptionPlan || 'FREE').toUpperCase();
  const planBadgeStyles = {
    YEARLY: 'bg-purple-50 text-purple-700 border-purple-200',
    QUARTERLY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MONTHLY: 'bg-green-50 text-green-700 border-green-200',
    FREE: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const shopName = shop.shopName || shop.businessName || shop.settings?.shopName || shop.name || 'Merchant Shop';
  const ownerName = shop.name || 'N/A';
  const businessName = shop.shopName || shop.settings?.shopName || shop.shopSettings?.businessName || shop.businessName;
  const gstNumber = shop.gstNumber || shop.settings?.gstNumber || shop.shopSettings?.gstin;
  const upiId = shop.upiId || shop.settings?.upiId || shop.shopSettings?.upiId;
  const address = shop.shopAddress || shop.settings?.shopAddress || shop.shopSettings?.address;
  const shortId = shop._id ? shop._id.slice(-6).toUpperCase() : '';

  const getInitials = (name) => {
    if (!name) return 'SH';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const expiryDate = shop.currentPeriodEnd || shop.subscriptionExpiresAt;
  const isPlanExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

  const getExpiryDisplay = () => {
    if (plan === 'FREE') {
      if (expiryDate && !isPlanExpired) {
        return {
          title: formatDate(expiryDate),
          subtext: 'Free trial active until date'
        };
      }
      return {
        title: 'Lifetime Free • No Expiry',
        subtext: 'Standard free access tier'
      };
    }
    if (!expiryDate) {
      return {
        title: 'No Expiry Set',
        subtext: 'Permanent plan validity'
      };
    }
    return {
      title: formatDate(expiryDate),
      subtext: isPlanExpired ? 'Subscription has expired' : 'Auto-renews or expires on date'
    };
  };

  const expiryInfo = getExpiryDisplay();

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Container: Bottom Sheet on Mobile, Centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-2xl lg:max-w-3xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">
          
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg border border-gray-200 bg-[#F5F5F5] flex items-center justify-center text-xs font-semibold text-[#093C5D] shrink-0">
                {getInitials(shopName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate" title={shopName}>
                    {shopName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border leading-none shrink-0 ${
                      planBadgeStyles[plan] || 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {plan}
                  </span>
                  {isSuspended ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 leading-none shrink-0">
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                  Shop ID: <span className="font-semibold text-gray-700">#{shortId}</span>
                  {shop.email && (
                    <>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <span>{shop.email}</span>
                    </>
                  )}
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

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
            {/* Suspended Alert Banner */}
            {isSuspended && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-xs sm:text-sm">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-red-900">This shop account is currently suspended</p>
                  <p className="mt-0.5 text-red-700 text-xs font-medium">
                    Reason: {shop.suspendedReason || 'Administrative suspension'}. Shopkeeper cannot log in or perform billing actions.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200">
                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-[#093C5D]" />
                  <span>Customers</span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
                  {shop.customerCount ?? 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200">
                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-[#093C5D]" />
                  <span>Bills Issued</span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
                  {shop.billsCount ?? 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/80">
                <div className="flex items-center gap-1.5 text-rose-700 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Pending Udhar</span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-rose-700 mt-1">
                  {formatCurrency(shop.totalUdhar ?? 0)}
                </p>
              </div>
            </div>

            {/* Shopkeeper Owner Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Shopkeeper Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Owner Name</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">{ownerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Registered Email</span>
                  <span className="font-medium text-gray-800 mt-0.5 block truncate" title={shop.email}>
                    {shop.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Phone Number</span>
                  <span className="font-medium text-gray-800 mt-0.5 block">
                    {shop.phone ? `+91 ${shop.phone}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Joined Platform</span>
                  <span className="font-medium text-gray-800 mt-0.5 block">
                    {shop.createdAt ? formatDate(shop.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Business Profile Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Business Settings & Store Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Business Name</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">
                    {businessName || <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">GST Number</span>
                  <span className="font-medium text-gray-800 mt-0.5 block">
                    {gstNumber || <span className="text-gray-400 font-normal italic">None</span>}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">UPI ID for Payments</span>
                  <span className="font-medium text-gray-800 mt-0.5 block">
                    {upiId || <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block text-xs">Store Address</span>
                  <span className="font-medium text-gray-800 mt-0.5 block truncate" title={address || ''}>
                    {address || <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription & Validity */}
            <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Subscription Status & Plan
                  </h4>
                </div>
                {onOpenPlanModal && (
                  <button
                    type="button"
                    onClick={() => onOpenPlanModal(shop)}
                    className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-[#093C5D] bg-[#093C5D]/10 hover:bg-[#093C5D]/15 border border-[#093C5D]/20 rounded-lg inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-none shrink-0"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} />
                    <span>Change Plan / Extend</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan Tier Tile */}
                <div className="p-3 bg-gray-50/80 border border-gray-200/80 rounded-lg flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Current Plan Tier
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${
                        planBadgeStyles[plan] || 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {plan}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      {plan === 'FREE' ? 'Standard Store Tier' : 'Pro Merchant Tier'}
                    </span>
                  </div>
                </div>

                {/* Expiry Tile */}
                <div className="p-3 bg-gray-50/80 border border-gray-200/80 rounded-lg flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Subscription Validity
                  </span>
                  <div className="mt-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                      {expiryInfo.title}
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal block mt-0.5">
                      {expiryInfo.subtext}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions & Security */}
            <div className="bg-white rounded-lg border border-gray-200 p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gray-100/90 border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Security & Active Sessions
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      Currently active on <span className="font-semibold text-gray-900">{shop.activeSessionsCount ?? 1} device(s)</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onForceLogout(shop)}
                  className="cursor-pointer h-8.5 px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-none shrink-0"
                  title="Terminate all active shopkeeper sessions"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <span>Terminate Sessions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0 gap-3">
            <button
              type="button"
              onClick={() => onOpenSuspendModal(shop)}
              className={`cursor-pointer h-9.5 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg border transition-all active:scale-95 inline-flex items-center gap-1.5 shadow-none shrink-0 ${
                isSuspended
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              {isSuspended ? (
                <>
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Unsuspend Shop</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Suspend Shop</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer h-9.5 px-5 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors active:scale-95 inline-flex items-center justify-center shadow-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsModal;
