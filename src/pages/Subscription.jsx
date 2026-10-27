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
    color: 'bg-gray-100 text-gray-800',
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
    color: 'bg-blue-50 text-[#093C5D] border-[#093C5D]',
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
    color: 'bg-blue-50 text-[#093C5D] border-[#093C5D]',
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
    color: 'bg-[#093C5D] text-white',
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

  // Real-time synchronization: Fetch live plans using React Query
  // When Admin updates pricing or limits, MainLayout invalidates 'publicPlans' and this automatically re-renders instantly!
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
            ? 'bg-[#093C5D] text-white'
            : p.planId === 'FREE'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-blue-50 text-[#093C5D] border-[#093C5D]',
        buttonText: p.planId === 'FREE' ? t('Current Plan') : `Upgrade to ${p.name}`,
        badge: p.badge,
      }));
    }
    return DEFAULT_PLANS;
  }, [livePlansData, t]);

  useEffect(() => {
    // Load Razorpay Script
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
      // 1. Create subscription on backend with Auto-Pay
      const resData = await api.post('/subscription/create-subscription', {
        plan: plan.id,
        couponCode: appliedCoupon?.code,
      });

      if (!resData.data || !resData.data.data) {
        throw new Error('Invalid subscription response');
      }

      // Handle 100% free promotional code activation directly
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

      // 2. Open Razorpay Checkout for Auto-Pay Subscription
      const options = {
        key: razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        name: "UdharPay",
        description: `${plan.name} Auto-Pay Subscription`,
        subscription_id: subscriptionId,
        handler: async function (response) {
          try {
            // 3. Verify subscription locally for immediate UX update
            const verifyRes = await api.post('/subscription/verify-subscription', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
              couponCode: appliedCoupon?.code,
            });

            if (verifyRes.data.success || verifyRes.status === 200) {
              toast.success(t('Subscription and Auto-Pay activated successfully!'));
              // Update user context
              dispatch(setUser({
                ...user,
                subscriptionStatus: verifyRes.data.data.subscriptionStatus || 'active',
                subscriptionPlan: verifyRes.data.data.subscriptionPlan || plan.id,
                currentPeriodEnd: verifyRes.data.data.currentPeriodEnd
              }));
            }
          } catch (error) {
            console.error('Verification failed', error);
            toast.error(t('Payment verification failed. Please contact support.'));
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: "#093C5D"
        }
      };

      const rzp1 = new window.Razorpay(options);

      rzp1.on('payment.failed', function (response) {
        toast.error(t('Payment failed! ') + response.error.description);
      });

      rzp1.open();

    } catch (error) {
      console.error(error);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Subscription')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your plan, billing, and recurring Auto-Pay mandates')}
          </p>
        </div>
      </div>

      {/* Current Plan Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:border-gray-300 transition-colors duration-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              user?.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-[#093C5D] border border-slate-200'
            }`}>
              <Shield className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-slate-500 text-xs sm:text-sm">{t('Current Plan')}: </span>
                <span className="font-bold text-[#093C5D] uppercase tracking-wide text-base sm:text-lg">
                  {user?.subscriptionPlan || 'FREE'}
                </span>
                {isPaidPlan && user?.subscriptionStatus === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-Pay Active
                  </span>
                )}
                {isPaidPlan && user?.subscriptionStatus === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Auto-Pay Cancelled
                  </span>
                )}
              </div>

              {user?.subscriptionStatus === 'active' && user?.currentPeriodEnd ? (
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t('Expires in')} <strong className="font-semibold text-slate-900">{getDaysRemaining(user.currentPeriodEnd)} {t('days')}</strong></span>
                  <span className="text-xs text-gray-400">({formatDate(user.currentPeriodEnd)})</span>
                </p>
              ) : isPaidPlan && user?.subscriptionStatus === 'cancelled' ? (
                <p className="text-xs sm:text-sm text-amber-700 font-medium flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t('Pro access remains active until')} <strong className="font-semibold text-gray-900">{user?.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : 'billing period end'}</strong></span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{t('Free trial expires in')} <strong className="font-semibold text-slate-900">{getDaysRemaining(trialEndDate)} {t('days')}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons for Active Subscriptions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <Link
              to="/settings"
              onClick={() => localStorage.setItem('udharpay_settings_tab', 'platform-invoices')}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Billing Receipts</span>
            </Link>

            {isPaidPlan && user?.subscriptionStatus === 'active' && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="cursor-pointer text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-lg transition-colors active:scale-95 whitespace-nowrap"
              >
                Cancel Auto-Pay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Pay Trust & Highlights Strip */}
      <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 border border-blue-200/80 rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="font-semibold text-gray-900 block mb-0.5">Hassle-Free Auto-Pay</strong>
              <span className="text-gray-600">UPI Autopay (GPay, PhonePe, Paytm), Cards & Netbanking mandates.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="font-semibold text-gray-900 block mb-0.5">Instant Platform Tax Receipts</strong>
              <span className="text-gray-600">Downloadable cloud PDF invoices generated automatically on each renewal.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="font-semibold text-gray-900 block mb-0.5">100% RBI e-Mandate Compliant</strong>
              <span className="text-gray-600">Pre-debit notifications before each cycle. Cancel recurring anytime with 1 click.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code Input Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-1.5">
                <span>{t('Have a Promo / Discount Code?')}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-500">
                {t('Enter your coupon to unlock extra savings on Pro subscriptions')}
              </p>
            </div>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-lg text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Code <strong className="font-mono">{appliedCoupon.code}</strong> applied ({appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `₹${appliedCoupon.discountValue} FLAT`})
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="cursor-pointer ml-1 text-emerald-600 hover:text-emerald-900 p-0.5 rounded"
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
                placeholder={t('PROMO CODE')}
                className="w-full sm:w-44 text-xs font-mono font-bold tracking-wider px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none uppercase"
              />
              <button
                type="submit"
                disabled={validatingCoupon}
                className="cursor-pointer px-4 py-2 bg-[#093C5D] text-white rounded-lg text-xs font-semibold hover:bg-[#072C44] transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {validatingCoupon ? t('Checking...') : t('Apply')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        {plans.map((plan) => {
          const discountedPrice = getDiscountedPrice(plan);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-white rounded-lg border p-5 md:p-6 transition-colors ${plan.id === 'YEARLY' ? 'border-[#093C5D]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              {plan.id === 'YEARLY' && (
                <div className="absolute -top-3 right-4 sm:right-6 bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-semibold uppercase tracking-wider py-1 px-3 rounded-lg">
                  {t('Best Value')}
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2 md:mt-3 flex items-baseline gap-1.5 flex-wrap">
                  {discountedPrice !== null ? (
                    <>
                      <span className="text-2xl md:text-3xl font-bold text-emerald-600">₹{discountedPrice}</span>
                      <span className="text-sm text-gray-400 line-through">₹{plan.price}</span>
                      <span className="text-xs text-gray-500 font-medium">/{plan.duration}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl md:text-3xl font-semibold text-gray-900">₹{plan.price}</span>
                      <span className="text-xs md:text-sm text-gray-500 font-medium">/{plan.duration}</span>
                    </>
                  )}
                </div>
                {discountedPrice !== null && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1 leading-tight">
                    Save ₹{plan.price - discountedPrice} on 1st cycle with {appliedCoupon.code} • Auto-renews at ₹{plan.price}/{plan.duration}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3.5 md:space-y-4 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="bg-green-50 rounded-full p-1 mt-0.5 shrink-0 flex items-center justify-center">
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-600" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={plan.id === 'FREE' || loadingPlan === plan.id || user?.subscriptionPlan === plan.id}
                className={`w-full py-2.5 md:py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all flex items-center justify-center
                  ${plan.id === 'FREE' || user?.subscriptionPlan === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : plan.id === 'YEARLY'
                      ? 'bg-[#093C5D] text-white hover:bg-[#082a42] active:scale-95 cursor-pointer'
                      : 'bg-blue-50 text-[#093C5D] hover:bg-blue-100 active:scale-95 cursor-pointer border border-[#093C5D]/20'
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

      {/* Cancel Auto-Pay Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-xs overscroll-contain animate-modal-overlay">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4 animate-modal-content">
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center -mt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cancel Auto-Pay Subscription?</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  Your Auto-Pay mandate will be stopped and Razorpay will not auto-debit on the next cycle. You will keep complete access to all your Pro features until{' '}
                  <strong className="text-gray-900">{user?.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : 'the end of your paid billing period'}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Pro features remain active until current billing cycle ends</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>No charges will be deducted from next cycle</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>You can restart or upgrade anytime</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingSubscription}
                className="cursor-pointer w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="cursor-pointer w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95"
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
