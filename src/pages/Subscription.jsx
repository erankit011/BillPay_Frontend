import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Shield, Loader2, Tag, Percent, X, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { validateSubscriptionCoupon, getPublicPlans } from '../features/admin/api/adminApi';

const DEFAULT_PLANS = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 0,
    duration: '7-Day Trial',
    features: [
      'Up to 2 Customers',
      'Up to 10 Bills',
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
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

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

  useEffect(() => {
    const fetchLivePlans = async () => {
      try {
        const livePlans = await getPublicPlans();
        if (livePlans && Array.isArray(livePlans) && livePlans.length > 0) {
          const mapped = livePlans.map((p) => ({
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
          setPlans(mapped);
        }
      } catch (err) {
        // Graceful fallback to default plans
      }
    };
    fetchLivePlans();
  }, [t]);

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
      // 1. Create subscription on backend
      const resData = await api.post('/subscription/create-subscription', { plan: plan.id });

      if (!resData.data || !resData.data.data.subscriptionId) {
        throw new Error('Invalid subscription response');
      }

      const { subscriptionId } = resData.data.data;

      // 2. Open Razorpay Checkout for Subscription
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        name: "UdharPay",
        description: `${plan.name} Subscription`,
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
              toast.success(t('Subscription upgraded successfully!'));
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

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Subscription')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">{t('Manage your plan and billing')}</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:border-gray-300 transition-colors duration-200">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] flex items-center justify-center shrink-0 ${user?.subscriptionStatus === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-[#093C5D]'}`}>
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-base sm:text-lg mb-0.5">
              <span className="font-medium text-slate-500">{t('Current Plan')}: </span>
              <span className="font-bold text-[#093C5D] uppercase tracking-wide">{user?.subscriptionPlan || 'FREE'}</span>
            </h2>
            {user?.subscriptionStatus === 'active' && user?.currentPeriodEnd ? (
              <p className="text-sm text-slate-500">
                {t('Expires in')} <span className="font-semibold text-slate-900">{getDaysRemaining(user.currentPeriodEnd)} {t('days')}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {t('Free trial expires in')}{' '}
                <span className="font-semibold text-slate-900">
                  {getDaysRemaining(
                    new Date(user?.createdAt || Date.now()).getTime() +
                      (plans.find((p) => p.id === 'FREE')?.trialDays || 7) * 24 * 60 * 60 * 1000
                  )}{' '}
                  {t('days')}
                </span>
              </p>
            )}
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
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                    Save ₹{plan.price - discountedPrice} with {appliedCoupon.code}
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
                t('Active')
              ) : (
                plan.buttonText
              )}
            </button>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default Subscription;
