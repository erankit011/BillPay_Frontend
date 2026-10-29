/**
 * Administrative Subscription Plan Override Modal
 * Allows platform administrators to manually assign plan tiers, extend validity dates,
 * and synchronize billing states for merchant accounts.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Crown, Calendar, Clock, Receipt } from 'lucide-react';
import { formatDate, calculateExtendedExpiry, isDateExpired } from '../../../utils/dateUtils';
import { getAdminPlans } from '../api/adminApi';

/**
 * Fallback Default Subscription Tier Options
 */
const DEFAULT_PLAN_OPTIONS = [
  {
    id: 'FREE',
    label: 'Free Plan (₹0)',
    price: 0,
    desc: 'Basic Starter • Trial Limit',
    badge: null,
    days: 0,
  },
  {
    id: 'MONTHLY',
    label: 'Monthly Pro (₹299)',
    price: 299,
    desc: 'Full Billing • Unlimited Customers & Automated Reminders',
    badge: '1 MONTH',
    days: 30,
  },
  {
    id: 'QUARTERLY',
    label: 'Quarterly Pro (₹799)',
    price: 799,
    desc: '3 Months Unlimited Access • Best Value for Kirana & Retail',
    badge: 'BEST VALUE',
    days: 90,
  },
  {
    id: 'YEARLY',
    label: 'Yearly Pro (₹2999)',
    price: 2999,
    desc: '1 Full Year Unlimited • Premium Support & Multi-device Sync',
    badge: 'SAVE 16%',
    days: 365,
  },
];

const PlanOverrideModal = ({ isOpen, onClose, shop, onConfirm, isLoading }) => {
  const currentPlan = (shop?.subscriptionPlan || 'FREE').toUpperCase();
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [customAmount, setCustomAmount] = useState('');
  const [isWaived, setIsWaived] = useState(false);

  /**
   * Plan Catalog Query
   * Queries dynamically configured subscription tiers from administrative endpoints.
   */
  const { data: adminPlans } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: getAdminPlans,
    staleTime: 30 * 1000,
  });

  const planOptions = useMemo(() => {
    if (adminPlans && Array.isArray(adminPlans) && adminPlans.length > 0) {
      return adminPlans.map((p) => ({
        id: p.planId,
        label: `${p.name} (₹${p.price})`,
        price: p.price ?? 0,
        desc: p.description || (p.planId === 'FREE' ? 'Basic Starter • Trial Limit' : 'Full Billing & Automated Reminders'),
        badge: p.badge || (p.planId === 'YEARLY' ? 'SAVE 16%' : p.planId === 'QUARTERLY' ? 'BEST VALUE' : p.planId === 'MONTHLY' ? '1 MONTH' : null),
        days: p.billingCycleDays || (p.planId === 'YEARLY' ? 365 : p.planId === 'QUARTERLY' ? 90 : p.planId === 'FREE' ? 0 : 30),
      }));
    }
    return DEFAULT_PLAN_OPTIONS;
  }, [adminPlans]);

  /**
   * Store Plan Synchronization
   * Updates locally selected tier when active shop target changes.
   */
  useEffect(() => {
    if (shop?.subscriptionPlan) {
      setSelectedPlan(shop.subscriptionPlan.toUpperCase());
    }
  }, [shop]);

  const selectedOption = planOptions.find((p) => p.id === selectedPlan) || planOptions[0];

  /**
   * Price Synchronization
   * Initializes custom amount to base tier price whenever selected tier changes.
   */
  useEffect(() => {
    if (selectedPlan === 'FREE') {
      setCustomAmount('0');
      setIsWaived(false);
    } else {
      setCustomAmount(String(selectedOption.price || 0));
      setIsWaived(false);
    }
  }, [selectedPlan, selectedOption?.price]);

  /**
   * Scroll & Touch Prevention Hook
   * Disables document scrolling and touch moves while modal dialog is open.
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

  if (!isOpen || !shop) return null;

  const hasActiveFutureExpiry = Boolean(
    shop?.currentPeriodEnd && !isDateExpired(shop.currentPeriodEnd)
  );

  /**
   * Expiry Date Calculation
   * Extends from future expiry if plan is currently active, or from current timestamp.
   */
  const calculatedExpiry = selectedPlan !== 'FREE'
    ? calculateExtendedExpiry(shop?.currentPeriodEnd, selectedOption.days)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveAmount = selectedPlan === 'FREE' || isWaived
      ? 0
      : (customAmount !== '' && !isNaN(Number(customAmount)))
        ? Math.max(0, Number(customAmount))
        : (selectedOption.price || 0);

    onConfirm({
      plan: selectedPlan,
      durationDays: selectedOption.days,
      expiryDate: calculatedExpiry ? calculatedExpiry.toISOString() : null,
      status: 'active',
      amount: effectiveAmount,
      paymentMethod: isWaived ? 'COMPLIMENTARY' : 'ADMIN_MANUAL_OVERRIDE',
    });
  };

  const shopDisplayName = shop.shopName || shop.businessName || shop.name || 'Merchant Shop';

  return (
    <div className="fixed inset-0 z-[60] overscroll-contain">
      {/**
       * Backdrop Overlay
       * Semi-transparent dark background dismissing plan override dialog on click.
       */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Modal Viewport Dialog
       * Renders as mobile bottom sheet or desktop centered dialogue modal.
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-[60] pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">
          
          {/**
           * Mobile Drag Pill
           * Visual drag pill indicator displayed on mobile devices.
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/**
           * Modal Header
           * Crown emblem, modal title banner, and round close button.
           */}
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

          {/**
           * Plan Override Configuration Form
           * Contains shop info, tier choices, validity previews, and billing controls.
           */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              
              {/**
               * Merchant Profile & Active Tier Card
               * Displays store name, email address, active plan badge, and current expiration date.
               */}
              <div className="p-3.5 bg-gray-50/80 border border-gray-200 rounded-lg space-y-2.5">
                {/**
                 * Shop Title & Plan Pill
                 * Basic shop identifier alongside current subscription tier chip.
                 */}
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

                  {/**
                   * Current Active Plan Chip
                   * Colored status badge indicating free or paid subscription status.
                   */}
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

                {/**
                 * Expiry Timestamp Row
                 * Displays current expiry date or free tier absence of expiration.
                 */}
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

              {/**
               * Plan Tier Selection Matrix
               * List of selectable subscription plans with pricing, duration, and feature notes.
               */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Subscription Tier
                </label>
                <div className="space-y-2">
                  {planOptions.map((plan) => {
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
                            {/**
                             * Promotional Plan Badge
                             * Highlight chip indicating savings or best value tiers.
                             */}
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

                        {/**
                         * Selection Radio Indicator
                         * Visual radio circle denoting currently selected plan tier.
                         */}
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

              {/**
               * Validity Extension Preview
               * Live calculation of added validity days and resulting expiration timestamp.
               */}
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

              {/**
               * Official Invoice Configuration
               * Form inputs for invoice amount, fee waiver checkbox, and receipt generation.
               */}
              <div className="p-3.5 bg-gray-50/80 border border-gray-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#093C5D]" />
                    <span className="text-xs font-semibold text-gray-900">
                      Platform Invoice Configuration
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded leading-none">
                    Tax Invoice Generated
                  </span>
                </div>

                {selectedPlan !== 'FREE' ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-medium text-gray-700">
                        Invoice Amount (₹):
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-600 font-medium">
                        <input
                          type="checkbox"
                          checked={isWaived}
                          onChange={(e) => {
                            setIsWaived(e.target.checked);
                            if (e.target.checked) setCustomAmount('0');
                            else setCustomAmount(String(selectedOption.price || 0));
                          }}
                          className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Waive Fee (₹0 Invoice)</span>
                      </label>
                    </div>

                    {!isWaived && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
                          placeholder="Amount in Rupees"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 font-normal">
                    Free starter tier invoice will be recorded with ₹0 amount for audit trail.
                  </div>
                )}

                <p className="text-[11px] text-gray-500 font-normal leading-normal border-t border-gray-200/60 pt-2">
                  A formal tax invoice and PDF receipt will be automatically generated, saved to merchant billing records, and emailed to the store.
                </p>
              </div>
            </div>

            {/**
             * Modal Action Footer
             * Buttons to dismiss modal or submit and execute plan tier override.
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
