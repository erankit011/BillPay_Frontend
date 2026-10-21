import React, { useState, useEffect } from 'react';
import { X, Crown, Calendar, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

const PLAN_OPTIONS = [
  {
    id: 'FREE',
    label: 'Free Plan (₹0)',
    desc: 'Basic Starter • 2 Customers & 10 Bills Trial Limit',
    badge: null,
    days: 0,
  },
  {
    id: 'MONTHLY',
    label: 'Monthly Pro (₹299)',
    desc: 'Full Billing • Unlimited Customers & Automated Reminders',
    badge: '1 MONTH',
    days: 30,
  },
  {
    id: 'QUARTERLY',
    label: 'Quarterly Pro (₹799)',
    desc: '3 Months Unlimited Access • Best Value for Kirana & Retail',
    badge: 'BEST VALUE',
    days: 90,
  },
  {
    id: 'YEARLY',
    label: 'Yearly Pro (₹2999)',
    desc: '1 Full Year Unlimited • Premium Support & Multi-device Sync',
    badge: 'SAVE 16%',
    days: 365,
  },
];

const PlanOverrideModal = ({ isOpen, onClose, shop, onConfirm, isLoading }) => {
  const currentPlan = (shop?.subscriptionPlan || 'FREE').toUpperCase();
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);

  // Sync state when shop changes
  useEffect(() => {
    if (shop?.subscriptionPlan) {
      setSelectedPlan(shop.subscriptionPlan.toUpperCase());
    }
  }, [shop]);

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

  const selectedOption = PLAN_OPTIONS.find((p) => p.id === selectedPlan) || PLAN_OPTIONS[0];

  // Current validity state & active check
  const currentExpiry = shop?.currentPeriodEnd ? new Date(shop.currentPeriodEnd) : null;
  const now = new Date();
  const hasActiveFutureExpiry = Boolean(currentExpiry && currentExpiry.getTime() > now.getTime());

  // Accurate Calculation:
  // - If FREE: No expiry (null)
  // - If Paid: Extend from existing active expiry if valid in future, else start from today (now)
  let calculatedExpiry = null;
  if (selectedPlan !== 'FREE' && selectedOption.days > 0) {
    const baseTime = hasActiveFutureExpiry ? currentExpiry.getTime() : now.getTime();
    calculatedExpiry = new Date(baseTime + selectedOption.days * 24 * 60 * 60 * 1000);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      plan: selectedPlan,
      durationDays: selectedOption.days,
      expiryDate: calculatedExpiry ? calculatedExpiry.toISOString() : null,
      status: 'active',
    });
  };

  const shopDisplayName = shop.shopName || shop.businessName || shop.name || 'Merchant Shop';

  return (
    <div className="fixed inset-0 z-[60] overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Container: Bottom Sheet on Mobile, Centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">
          
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <Crown className="w-5 h-5 text-amber-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                  Update Subscription Plan
                </h3>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  Change plan tier & manage merchant validity
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              
              {/* Merchant Details & Current Subscription Card */}
              <div className="p-3.5 bg-gray-50/80 border border-gray-200 rounded-lg space-y-2.5">
                {/* Shop Info + Current Plan Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug truncate" title={shopDisplayName}>
                      {shopDisplayName}
                    </h4>
                    {shop.email && (
                      <p className="text-[11px] text-gray-500 font-normal truncate mt-0.5" title={shop.email}>
                        {shop.email}
                      </p>
                    )}
                  </div>

                  {/* Current Active Plan Badge / Button UI */}
                  <div className="flex items-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border shadow-none ${
                        currentPlan === 'FREE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          currentPlan === 'FREE' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                      {currentPlan}
                    </span>
                  </div>
                </div>

                {/* Expiry Details Row */}
                <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 text-gray-500">
                    <div className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <Clock className="w-3 h-3 text-[#093C5D]" />
                    </div>
                    <span className="font-medium">Current Expiry:</span>
                  </div>
                  <strong className="font-semibold text-gray-900 text-xs truncate">
                    {shop.currentPeriodEnd ? formatDate(shop.currentPeriodEnd) : 'No Expiry (Free Tier)'}
                  </strong>
                </div>
              </div>

              {/* Plan Options */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Subscription Tier
                </label>
                <div className="space-y-2">
                  {PLAN_OPTIONS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#093C5D] bg-blue-50/40 ring-1 ring-[#093C5D]'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                              {plan.label}
                            </span>
                            {/* Green badge kept for plans that have a badge */}
                            {plan.badge && (
                              <span className="inline-flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded leading-none">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium mt-1 leading-normal">
                            {plan.desc}
                          </p>
                        </div>

                        {/* Clean Standard Radio Circle */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-[#093C5D] bg-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#093C5D]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accurate Plan Validity & Expiry Preview */}
              {selectedPlan === 'FREE' ? (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Selected Plan Validity:</span>
                  </div>
                  <span className="font-semibold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider">
                    Free Tier • No Expiry Limit
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-gray-50/80 border border-gray-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Calendar className="w-3 h-3 text-[#093C5D]" />
                      </div>
                      <span className="font-medium">Plan Duration Added:</span>
                    </div>
                    <span className="font-semibold text-[#093C5D] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded text-[11px] shrink-0">
                      +{selectedOption.days} Days ({selectedOption.badge})
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-xs">
                        {hasActiveFutureExpiry ? 'Extended Expiry Date:' : 'New Expiry Date:'}
                      </span>
                    </div>
                    <strong className="font-semibold text-emerald-800 text-[11px] sm:text-xs truncate bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0 inline-flex items-center justify-center leading-none">
                      {calculatedExpiry ? formatDate(calculatedExpiry) : 'N/A'}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                className="cursor-pointer h-10 px-5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-[#093C5D] hover:bg-[#082a42] border border-[#093C5D] shadow-none transition-all active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                <Crown className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2} />
                <span>{isLoading ? 'Updating...' : 'Save Plan Update'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanOverrideModal;
