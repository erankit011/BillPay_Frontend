/**
 * Merchant SaaS Subscription & Billing Upgrade Portal
 * Manages plan selection, promotional coupon redemptions, Razorpay checkout, and subscription cancellation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Shield,
  Loader2,
  Tag,
  Percent,
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { validateSubscriptionCoupon, getPublicPlans, cancelSubscription } from '../features/admin/api/adminApi';
import { getDaysRemaining, getTrialEndDate, formatDate } from '../utils/dateUtils';

/**
 * Fallback Subscription Tiers
 */
const DEFAULT_PLANS = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 0,
    duration: '7-Day Trial',
    features: [
      'Up to 2 Customers',
      'Up to 5 Bills',
      'Email Support',
    ],
    color: 'bg-[#F0F2F6] text-[#4E5668]',
    buttonText: 'Current Plan',
  },
  {
    id: 'MONTHLY',
    name: 'Monthly Pro',
    price: 299,
    duration: 'Per Month',
    features: [
      'Unlimited Customers',
      'WhatsApp Reminders',
      'Advanced Analytics',
      'Priority Support',
    ],
    color: 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]',
    buttonText: 'Upgrade to Monthly',
  },
  {
    id: 'QUARTERLY',
    name: 'Quarterly Pro',
    price: 799,
    duration: 'Per 3 Months',
    features: [
      'Unlimited Customers',
      'WhatsApp Reminders',
      'Advanced Analytics',
      'Priority Support',
      'Save 10%',
    ],
    color: 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]',
    buttonText: 'Upgrade to Quarterly',
  },
  {
    id: 'YEARLY',
    name: 'Yearly Pro',
    price: 2999,
    duration: 'Per Year',
    features: [
      'Unlimited Customers',
      'WhatsApp Reminders',
      'Advanced Analytics',
      'Priority Support',
      'Save 16%',
    ],
    color: 'bg-[#4338CA] text-white',
    buttonText: 'Upgrade to Yearly',
  },
];

const Subscription = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  /**
   * Real-Time Plan Synchronization
   * Automatically refreshes tiers and limits via React Query cache invalidations
   */
  const { data: livePlansData } = useQuery({
    queryKey: ['publicPlans'],
    queryFn: getPublicPlans,
    staleTime: 30 * 1000,
  });

  const plans = useMemo(() => {
    if (livePlansData && Array.isArray(livePlansData) && livePlansData.length > 0) {
      return livePlansData.map((p) => ({
        id: p.planId,
        name: p.name,
        price: p.price,
        duration:
          p.planId === 'FREE'
            ? `${p.trialDays || 7}-Day Trial`
            : p.billingCycleDays === 365
            ? t('Per Year')
            : p.billingCycleDays === 90
            ? t('Per 3 Months')
            : t('Per Month'),
        features:
          p.features && p.features.length > 0
            ? p.features
            : [
                p.maxCustomers === -1
                  ? t('Unlimited Customers')
                  : `Up to ${p.maxCustomers} Customers`,
                p.maxBills === -1 ? t('Unlimited Bills') : `Up to ${p.maxBills} Bills`,
                p.hasWhatsAppReminders ? t('WhatsApp Reminders') : t('Standard Reminders'),
                p.supportTier === 'PRIORITY' || p.supportTier === 'DEDICATED'
                  ? t('Priority Support')
                  : t('Email Support'),
              ],
        color:
          p.planId === 'YEARLY'
            ? 'bg-[#4338CA] text-white'
            : p.planId === 'FREE'
            ? 'bg-[#F0F2F6] text-[#4E5668]'
            : 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]',
        buttonText: p.planId === 'FREE' ? t('Current Plan') : `Upgrade to ${p.name}`,
        badge: p.badge,
      }));
    }
    return DEFAULT_PLANS;
  }, [livePlansData, t]);

  /**
   * Razorpay Checkout Script Loader
   * Dynamically injects payment gateway SDK on initial component mount
   */
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };
    loadRazorpayScript();
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error(t('Please enter a coupon code'));
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await validateSubscriptionCoupon(couponCode.trim().toUpperCase());
      setAppliedCoupon(res);
      toast.success(res?.message || t('Coupon applied successfully!'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('Invalid or expired coupon code'));
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast(t('Coupon removed'));
  };

  const getDiscountedPrice = (plan) => {
    if (!appliedCoupon || plan.id === 'FREE') return null;
    if (appliedCoupon.applicablePlans && !appliedCoupon.applicablePlans.includes(plan.id)) {
      return null;
    }
    let discount = 0;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discount = Math.round((plan.price * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscountAmount && discount > appliedCoupon.maxDiscountAmount) {
        discount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(plan.price, appliedCoupon.discountValue);
    }
    return Math.max(0, plan.price - discount);
  };

  const handleUpgrade = async (plan) => {
    if (plan.id === 'FREE') return;

    if (!scriptLoaded) {
      toast.error(t('Payment system is loading, please wait...'));
      return;
    }

    setLoadingPlan(plan.id);

    try {
      /**
       * Server Subscription Creation
       * Initiates recurring Auto-Pay mandate order via gateway endpoint
       */
      const resData = await api.post('/subscription/create-subscription', {
        plan: plan.id,
        couponCode: appliedCoupon?.code,
      });

      if (!resData.data || !resData.data.data) {
        throw new Error('Invalid subscription response');
      }

      /**
       * Promotional Discount Activation
       * Auto-activates subscription immediately if 100% coupon discount applies
       */
      if (resData.data.data.activated) {
        toast.success(t('Subscription upgraded successfully with 100% promo discount!'));
        dispatch(
          setUser({
            ...user,
            subscriptionStatus: resData.data.data.subscriptionStatus || 'active',
            subscriptionPlan: resData.data.data.subscriptionPlan || plan.id,
            currentPeriodEnd: resData.data.data.currentPeriodEnd,
          })
        );
        return;
      }

      const { subscriptionId, razorpayKeyId } = resData.data.data;
      if (!subscriptionId) {
        throw new Error('Subscription identifier missing from gateway response');
      }

      /**
       * Razorpay Modal Checkout
       * Launches payment gateway interface to authorize mandate
       */
      const options = {
        key: razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        name: "UdharPay",
        description: `${plan.name} Auto-Pay Subscription`,
        subscription_id: subscriptionId,
        handler: async function (response) {
          try {
            /**
             * Gateway Subscription Verification
             * Verifies cryptographic signature for immediate client authorization
             */
            const verifyRes = await api.post('/subscription/verify-subscription', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
              couponCode: appliedCoupon?.code,
            });

            if (verifyRes.data.success || verifyRes.status === 200) {
              toast.success(t('Subscription and Auto-Pay activated successfully!'));
              /**
               * User Authentication Store Synchronization
               * Updates local Redux store with upgraded plan details
               */
              dispatch(setUser({
                ...user,
                subscriptionStatus: verifyRes.data.data.subscriptionStatus || 'active',
                subscriptionPlan: verifyRes.data.data.subscriptionPlan || plan.id,
                currentPeriodEnd: verifyRes.data.data.currentPeriodEnd
              }));
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Verification failed', error);
            }
            toast.error(error.response?.data?.message || t('Payment verification failed. Please contact support.'));
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: "#4338CA"
        }
      };

      const rzp1 = new window.Razorpay(options);

      rzp1.on('payment.failed', function (response) {
        toast.error(t('Payment failed! ') + response.error.description);
      });

      rzp1.open();

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error(error.response?.data?.message || t('Failed to initiate payment. Check API Keys.'));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancellingSubscription(true);
      const res = await cancelSubscription();
      toast.success(res?.message || t('Auto-Pay cancelled successfully'));
      dispatch(
        setUser({
          ...user,
          subscriptionStatus: 'cancelled',
        })
      );
      setShowCancelModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('Failed to cancel Auto-Pay'));
    } finally {
      setCancellingSubscription(false);
    }
  };

  const freeTrialDays = plans.find((p) => p.id === 'FREE')?.trialDays || 7;
  const trialEndDate = getTrialEndDate(user, freeTrialDays);
  const isPaidPlan = user?.subscriptionPlan && user?.subscriptionPlan !== 'FREE';

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/**
       * Subscription Header Section
       * Displays title and description of plan management portal
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">{t('Subscription')}</h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your plan, billing, and recurring Auto-Pay mandates')}
          </p>
        </div>
      </div>

      {/**
       * Current Plan Status Overview
       * Highlights active subscription tier, auto-pay status, and validity period
       */}
      <div className="bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] p-4 sm:p-5 md:p-6 transition-colors duration-200 shadow-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 border ${
              user?.subscriptionStatus === 'active' ? 'bg-[#ECFDF5] text-[#0D7A57] border-[#A7F3D0]' : 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]'
            }`}>
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-[#757F94] text-xs sm:text-sm">{t('Current Plan')}: </span>
                <span className="font-semibold text-[#4338CA] uppercase tracking-wide text-base sm:text-lg">
                  {user?.subscriptionPlan || 'FREE'}
                </span>
                {isPaidPlan && user?.subscriptionStatus === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A57] animate-pulse" />
                    {t('Auto-Pay Active')}
                  </span>
                )}
                {isPaidPlan && user?.subscriptionStatus === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                    {t('Auto-Pay Cancelled')}
                  </span>
                )}
              </div>

              {user?.subscriptionStatus === 'active' && user?.currentPeriodEnd ? (
                <p className="text-xs sm:text-sm text-[#757F94] font-medium flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{t('Expires in')} <strong className="font-semibold text-[#191E2B]">{getDaysRemaining(user.currentPeriodEnd)} {t('days')}</strong></span>
                  <span className="text-xs text-gray-400 font-normal">({formatDate(user.currentPeriodEnd)})</span>
                </p>
              ) : isPaidPlan && user?.subscriptionStatus === 'cancelled' ? (
                <p className="text-xs sm:text-sm text-[#B45309] font-medium flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t('Pro access remains active until')} <strong className="font-semibold text-[#191E2B]">{user?.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : 'billing period end'}</strong></span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-[#757F94] font-medium flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{t('Free trial expires in')} <strong className="font-semibold text-[#191E2B]">{getDaysRemaining(trialEndDate)} {t('days')}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/**
           * Subscription Action Controls
           * Quick navigation to platform invoices or mandate cancellation modal
           */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E8ECF2]">
            <Link
              to="/settings"
              onClick={() => localStorage.setItem('udharpay_settings_tab', 'platform-invoices')}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#4E5668] bg-[#FBFBFC] hover:bg-[#F0F2F6] border border-[#DCE1EA] px-3.5 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-none"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>{t('Billing Receipts')}</span>
            </Link>

            {isPaidPlan && user?.subscriptionStatus === 'active' && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#B91C1C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] px-3.5 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-none"
              >
                <span>{t('Cancel Auto-Pay')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/**
       * Auto-Pay Benefits Strip
       * Displays trust guarantees, RBI compliance, and invoice download perks
       */}
      <div className="bg-[#EEF0FB]/40 border border-[#D8DCF5] rounded-lg p-4 sm:p-5 shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBFBFC] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center shrink-0 shadow-none">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[#191E2B] text-xs sm:text-sm mb-0.5">{t('Hassle-Free Auto-Pay')}</h4>
              <p className="text-[#4E5668] font-medium text-xs leading-relaxed">
                {t('UPI Autopay (GPay, PhonePe, Paytm), Cards & Netbanking mandates.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBFBFC] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center shrink-0 shadow-none">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[#191E2B] text-xs sm:text-sm mb-0.5">{t('Instant Platform Tax Receipts')}</h4>
              <p className="text-[#4E5668] font-medium text-xs leading-relaxed">
                {t('Downloadable cloud PDF invoices generated automatically on each renewal.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBFBFC] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center shrink-0 shadow-none">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[#191E2B] text-xs sm:text-sm mb-0.5">{t('100% RBI e-Mandate Compliant')}</h4>
              <p className="text-[#4E5668] font-medium text-xs leading-relaxed">
                {t('Pre-debit notifications before each cycle. Cancel recurring anytime with 1 click.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/**
       * Promotional Coupon Section
       * Discount input field or active coupon tag with removal trigger
       */}
      <div className="bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] p-4 sm:p-5 shadow-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#191E2B] tracking-tight flex items-center gap-1.5">
                <span>{t('Have a Promo / Discount Code?')}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-xs text-[#757F94] font-medium">
                {t('Enter your coupon to unlock extra savings on Pro subscriptions')}
              </p>
            </div>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#0D7A57] px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-none">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Code <strong className="font-mono">{appliedCoupon.code}</strong> applied ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} FLAT`})
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="cursor-pointer ml-1 text-emerald-600 hover:text-emerald-900 p-0.5 rounded transition-colors"
                title="Remove Coupon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t('Enter Promo Code')}
                className="w-full sm:w-48 text-xs sm:text-sm font-semibold tracking-wider px-3.5 py-2 border border-[#DCE1EA] rounded-lg focus:ring-1 focus:ring-[#4338CA] focus:border-[#4338CA] outline-none uppercase placeholder:font-medium placeholder:normal-case placeholder:text-[#9AA4B8] bg-white text-[#191E2B] transition-colors shadow-none"
              />
              <button
                type="submit"
                disabled={validatingCoupon}
                className="cursor-pointer px-4 sm:px-5 py-2 bg-[#4338CA] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#3730A3] active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 shadow-none"
              >
                {validatingCoupon ? t('Checking...') : t('Apply')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/**
       * Subscription Pricing Matrix
       * Comparison grid displaying free trial, monthly, quarterly, and yearly tiers
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        {plans.map((plan) => {
          const discountedPrice = getDiscountedPrice(plan);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-[#FBFBFC] rounded-lg border p-5 md:p-6 transition-colors shadow-none ${plan.id === 'YEARLY' ? 'border-[#4338CA]' : 'border-[#DCE1EA] hover:border-[#C2C9D6]'}`}
            >
              {plan.id === 'YEARLY' && (
                <div className="absolute -top-3 right-4 sm:right-6 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] md:text-xs font-semibold uppercase tracking-wider py-1 px-3 rounded-lg shadow-none">
                  {t('Best Value')}
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-base md:text-lg font-semibold text-[#191E2B]">{plan.name}</h3>
                <div className="mt-2 md:mt-3 flex items-baseline gap-1.5 flex-wrap">
                  {discountedPrice !== null ? (
                    <>
                      <span className="text-2xl md:text-3xl font-bold text-[#0D7A57]">₹{discountedPrice}</span>
                      <span className="text-sm text-gray-400 line-through">₹{plan.price}</span>
                      <span className="text-xs text-[#757F94] font-medium">/{plan.duration}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl md:text-3xl font-semibold text-[#191E2B]">₹{plan.price}</span>
                      <span className="text-xs md:text-sm text-[#757F94] font-medium">/{plan.duration}</span>
                    </>
                  )}
                </div>
                {discountedPrice !== null && (
                  <p className="text-[11px] font-semibold text-[#0D7A57] mt-1 leading-tight">
                    Save ₹{plan.price - discountedPrice} on 1st cycle with {appliedCoupon.code} • Auto-renews at ₹{plan.price}/{plan.duration}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3.5 md:space-y-4 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="bg-[#ECFDF5] rounded-full p-1 mt-0.5 shrink-0 flex items-center justify-center border border-[#A7F3D0]">
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#0D7A57]" />
                    </div>
                    <span className="text-xs md:text-sm text-[#4E5668] font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={plan.id === 'FREE' || loadingPlan === plan.id || user?.subscriptionPlan === plan.id}
                className={`w-full py-2.5 md:py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all flex items-center justify-center
                  ${plan.id === 'FREE' || user?.subscriptionPlan === plan.id
                    ? 'bg-[#F0F2F6] text-[#757F94] cursor-default'
                    : plan.id === 'YEARLY'
                      ? 'bg-[#4338CA] text-white hover:bg-[#3730A3] active:scale-95 cursor-pointer shadow-none'
                      : 'bg-[#EEF0FB] text-[#4338CA] hover:bg-[#E0E4F9] active:scale-95 cursor-pointer border border-[#D8DCF5] shadow-none'
                  }
                `}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user?.subscriptionPlan === plan.id ? (
                  t('Active Plan')
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/**
       * Cancel Auto-Pay Confirmation Modal
       * Confirmation dialog preventing accidental mandate cancellation
       */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#191E2B]/50 overscroll-contain animate-modal-overlay">
          <div className="bg-[#FBFBFC] rounded-t-2xl sm:rounded-lg max-w-md w-full p-5 sm:p-6 border border-[#DCE1EA] space-y-4 animate-modal-content shadow-none">
            {/**
             * Mobile Bottom-Sheet Grab Handle
             * Visual pull indicator for compact mobile viewport view
             */}
            <div className="sm:hidden flex justify-center -mt-2 pb-1">
              <div className="w-10 h-1 bg-[#DCE1EA] rounded-full" />
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-[#FFFBEB] text-[#B45309] flex items-center justify-center border border-[#FDE68A] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#191E2B]">Cancel Auto-Pay Subscription?</h3>
                <p className="text-xs sm:text-sm text-[#4E5668] mt-1 leading-relaxed font-medium">
                  Your Auto-Pay mandate will be stopped and Razorpay will not auto-debit on the next cycle. You will keep complete access to all your Pro features until{' '}
                  <strong className="text-[#191E2B] font-semibold">{user?.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : 'the end of your paid billing period'}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F0F2F6] rounded-lg border border-[#DCE1EA] text-xs text-[#4E5668] space-y-1.5 shadow-none">
              <div className="flex items-center gap-2 text-[#4E5668] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A57]" />
                <span>Pro features remain active until current billing cycle ends</span>
              </div>
              <div className="flex items-center gap-2 text-[#4E5668] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A57]" />
                <span>No charges will be deducted from next cycle</span>
              </div>
              <div className="flex items-center gap-2 text-[#4E5668] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A57]" />
                <span>You can restart or upgrade anytime</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingSubscription}
                className="cursor-pointer w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#F0F2F6] hover:bg-[#EBEEF4] border border-[#DCE1EA] rounded-lg transition-colors text-center shadow-none active:scale-95"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="cursor-pointer w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-none"
              >
                {cancellingSubscription && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Cancel Auto-Pay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
