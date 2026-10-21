import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Save,
  Plus,
  Trash2,
  Crown,
  Users,
  FileText,
  MessageCircle,
  Mic,
  BarChart2,
  Headphones,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SUPPORT_TIERS = [
  { value: 'COMMUNITY', label: 'Community Support' },
  { value: 'EMAIL', label: 'Standard Email Support' },
  { value: 'PRIORITY', label: 'Priority Support (Fast Response)' },
  { value: 'DEDICATED', label: '24/7 Dedicated Account Manager' },
];

const ThemeCheckbox = ({ checked, onChange, size = 'md', className = '' }) => {
  const isSm = size === 'sm';
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        if (onChange) {
          e.stopPropagation();
          onChange(!checked);
        }
      }}
      className={`${
        isSm ? 'w-4 h-4 rounded' : 'w-5 h-5 rounded-md'
      } flex items-center justify-center transition-all duration-150 shrink-0 border-2 select-none cursor-pointer ${
        checked
          ? 'bg-[#093C5D] border-[#093C5D] text-white shadow-none'
          : 'bg-white border-gray-300 hover:border-[#093C5D]/70'
      } ${className}`}
    >
      <Check
        className={`${
          isSm ? 'w-3 h-3 stroke-[3]' : 'w-3.5 h-3.5 stroke-[3]'
        } transition-all duration-150 ${
          checked ? 'opacity-100 scale-100 text-white' : 'opacity-0 scale-50'
        }`}
      />
    </div>
  );
};

const EditPlanModal = ({ isOpen, plan, onClose, onSave }) => {
  const { t } = useTranslation();

  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [price, setPrice] = useState(plan?.price ?? 0);
  const [billingCycleDays, setBillingCycleDays] = useState(plan?.billingCycleDays || 30);
  const [unlimitedCustomers, setUnlimitedCustomers] = useState(plan?.maxCustomers === -1);
  const [maxCustomers, setMaxCustomers] = useState(plan?.maxCustomers === -1 ? 100 : (plan?.maxCustomers || 100));
  const [unlimitedBills, setUnlimitedBills] = useState(plan?.maxBills === -1);
  const [maxBills, setMaxBills] = useState(plan?.maxBills === -1 ? 500 : (plan?.maxBills || 500));
  const [trialDays, setTrialDays] = useState(plan?.trialDays || 0);
  const [badge, setBadge] = useState(plan?.badge || '');
  const [isRecommended, setIsRecommended] = useState(Boolean(plan?.isRecommended));
  const [isActive, setIsActive] = useState(Boolean(plan?.isActive));
  const [supportTier, setSupportTier] = useState(plan?.supportTier || 'PRIORITY');
  const [hasWhatsAppReminders, setHasWhatsAppReminders] = useState(Boolean(plan?.hasWhatsAppReminders));
  const [hasVoiceBilling, setHasVoiceBilling] = useState(Boolean(plan?.hasVoiceBilling));
  const [hasAdvancedAnalytics, setHasAdvancedAnalytics] = useState(Boolean(plan?.hasAdvancedAnalytics));
  const [features, setFeatures] = useState(plan?.features || []);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!isOpen || !plan) return;
    const initial = {
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price ?? 0,
      billingCycleDays: plan.billingCycleDays || 30,
      unlimitedCustomers: plan.maxCustomers === -1,
      maxCustomers: plan.maxCustomers === -1 ? 100 : (plan.maxCustomers || 100),
      unlimitedBills: plan.maxBills === -1,
      maxBills: plan.maxBills === -1 ? 500 : (plan.maxBills || 500),
      trialDays: plan.trialDays || 0,
      badge: plan.badge || '',
      isRecommended: Boolean(plan.isRecommended),
      isActive: Boolean(plan.isActive),
      supportTier: plan.supportTier || 'PRIORITY',
      hasWhatsAppReminders: Boolean(plan.hasWhatsAppReminders),
      hasVoiceBilling: Boolean(plan.hasVoiceBilling),
      hasAdvancedAnalytics: Boolean(plan.hasAdvancedAnalytics),
      features: Array.isArray(plan.features) ? [...plan.features] : [],
    };

    setName(initial.name);
    setDescription(initial.description);
    setPrice(initial.price);
    setBillingCycleDays(initial.billingCycleDays);
    setUnlimitedCustomers(initial.unlimitedCustomers);
    setMaxCustomers(initial.maxCustomers);
    setUnlimitedBills(initial.unlimitedBills);
    setMaxBills(initial.maxBills);
    setTrialDays(initial.trialDays);
    setBadge(initial.badge);
    setIsRecommended(initial.isRecommended);
    setIsActive(initial.isActive);
    setSupportTier(initial.supportTier);
    setHasWhatsAppReminders(initial.hasWhatsAppReminders);
    setHasVoiceBilling(initial.hasVoiceBilling);
    setHasAdvancedAnalytics(initial.hasAdvancedAnalytics);
    setFeatures(initial.features);
    setNewFeatureText('');
    setInitialData(initial);
  }, [plan, isOpen]);

  const hasChanges = Boolean(
    initialData && (
      name.trim() !== initialData.name.trim() ||
      description.trim() !== initialData.description.trim() ||
      Number(price) !== Number(initialData.price) ||
      Number(billingCycleDays) !== Number(initialData.billingCycleDays) ||
      unlimitedCustomers !== initialData.unlimitedCustomers ||
      (!unlimitedCustomers && Number(maxCustomers) !== Number(initialData.maxCustomers)) ||
      unlimitedBills !== initialData.unlimitedBills ||
      (!unlimitedBills && Number(maxBills) !== Number(initialData.maxBills)) ||
      Number(trialDays) !== Number(initialData.trialDays) ||
      badge.trim() !== initialData.badge.trim() ||
      isRecommended !== initialData.isRecommended ||
      isActive !== initialData.isActive ||
      supportTier !== initialData.supportTier ||
      hasWhatsAppReminders !== initialData.hasWhatsAppReminders ||
      hasVoiceBilling !== initialData.hasVoiceBilling ||
      hasAdvancedAnalytics !== initialData.hasAdvancedAnalytics ||
      JSON.stringify(features) !== JSON.stringify(initialData.features)
    )
  );

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    if (features.length >= 10) {
      toast.error(t('Maximum 10 feature bulletpoints allowed'));
      return;
    }
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) {
      return;
    }
    if (!name.trim()) {
      toast.error(t('Plan name is required'));
      return;
    }
    if (price < 0) {
      toast.error(t('Price cannot be negative'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        billingCycleDays: Number(billingCycleDays),
        maxCustomers: unlimitedCustomers ? -1 : Number(maxCustomers),
        maxBills: unlimitedBills ? -1 : Number(maxBills),
        trialDays: Number(trialDays),
        badge: badge.trim(),
        isRecommended,
        isActive,
        supportTier,
        hasWhatsAppReminders,
        hasVoiceBilling,
        hasAdvancedAnalytics,
        features,
      };

      await onSave(plan.planId, payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* ── Modal Container ── */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-6 z-50 pointer-events-none overscroll-contain">
        <div
          className="relative bg-white w-full sm:max-w-2xl lg:max-w-3xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0 bg-white">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* ── Modal Header (App Theme Standard) ── */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center border border-[#093C5D]/20 shrink-0">
                <Layers className="w-5 h-5 text-[#093C5D]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                    {t('Configure Tier: {{name}}', { name: plan.name })}
                  </h3>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium border border-gray-200">
                    {plan.planId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  {t('Set live pricing, customer quotas, and merchant feature entitlements.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 ml-auto"
              title={t('Close')}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* ── Form Body (Properly Scrollable with min-h-0 and ample bottom padding) ── */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0 overscroll-contain pb-10">
              
              {/* 1. Plan Basic Information Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-gray-200 bg-white space-y-4 shadow-none">
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <Sparkles className="w-4 h-4 text-[#093C5D]" />
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                    {t('Plan Identity & Branding')}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Plan Display Name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Monthly Pro"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Badge Label (e.g. Save 16%, Starter)')}
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder={t('Leave empty for no badge')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Subtitle Description')}
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('Short tagline shown below the title')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Pricing & Validity Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-gray-200 bg-white space-y-4 shadow-none">
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <IndianRupee className="w-4 h-4 text-[#093C5D]" />
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                    {t('Pricing & Billing Cycle')}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Base Price (₹)')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs sm:text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-white transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Billing Cycle (Days)')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={billingCycleDays}
                        onChange={(e) => setBillingCycleDays(Math.max(1, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-gray-300 px-3 pr-12 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-white transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        required
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-medium">
                        {t('Days')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Trial Period (Days)')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={trialDays}
                        onChange={(e) => setTrialDays(Math.max(0, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-gray-300 px-3 pr-12 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-white transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-medium">
                        {t('Days')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Operational Limits (Side by side cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Customer Limit Card */}
                <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3 shadow-none">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#093C5D]" />
                      <span>{t('Customer Limit')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnlimitedCustomers(!unlimitedCustomers)}
                      className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#093C5D] select-none hover:opacity-85 transition-opacity"
                    >
                      <ThemeCheckbox checked={unlimitedCustomers} size="sm" />
                      <span>{t('Unlimited')}</span>
                    </button>
                  </div>
                  {!unlimitedCustomers ? (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        {t('Max customers allowed')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxCustomers}
                        onChange={(e) => setMaxCustomers(Math.max(1, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        placeholder={t('Max allowed customers')}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-medium py-1">
                      {t('Storekeepers can create unlimited customer ledgers.')}
                    </p>
                  )}
                </div>

                {/* Bill Limit Card */}
                <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3 shadow-none">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>{t('Invoices / Bills Limit')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnlimitedBills(!unlimitedBills)}
                      className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#093C5D] select-none hover:opacity-85 transition-opacity"
                    >
                      <ThemeCheckbox checked={unlimitedBills} size="sm" />
                      <span>{t('Unlimited')}</span>
                    </button>
                  </div>
                  {!unlimitedBills ? (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        {t('Max bills per cycle')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxBills}
                        onChange={(e) => setMaxBills(Math.max(1, Number(e.target.value)))}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        placeholder={t('Max allowed bills')}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-medium py-1">
                      {t('Storekeepers can generate unlimited invoices per cycle.')}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Feature Entitlements & Switches Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-gray-200 bg-white space-y-3.5 shadow-none">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#093C5D]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                      {t('Feature Entitlements & Switches')}
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 hidden sm:inline">
                    {t('Toggle features enabled for this tier')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* WhatsApp Alerts Tile */}
                  <div
                    onClick={() => setHasWhatsAppReminders(!hasWhatsAppReminders)}
                    className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                      hasWhatsAppReminders
                        ? 'border-[#093C5D] bg-[#093C5D]/[0.05]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <ThemeCheckbox checked={hasWhatsAppReminders} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate">
                          {t('WhatsApp Alerts')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                        {t('Automated reminder messages & receipt delivery')}
                      </p>
                    </div>
                  </div>

                  {/* Voice Billing Tile */}
                  <div
                    onClick={() => setHasVoiceBilling(!hasVoiceBilling)}
                    className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                      hasVoiceBilling
                        ? 'border-[#093C5D] bg-[#093C5D]/[0.05]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <ThemeCheckbox checked={hasVoiceBilling} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate">
                          {t('Voice Billing')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                        {t('Speech-to-bill AI recognition engine')}
                      </p>
                    </div>
                  </div>

                  {/* Advanced Analytics Tile */}
                  <div
                    onClick={() => setHasAdvancedAnalytics(!hasAdvancedAnalytics)}
                    className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                      hasAdvancedAnalytics
                        ? 'border-[#093C5D] bg-[#093C5D]/[0.05]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <ThemeCheckbox checked={hasAdvancedAnalytics} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate">
                          {t('Advanced Analytics')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                        {t('Profit margins & business growth trends')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Support Level Tier & Visibility Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-gray-200 bg-white space-y-4 shadow-none">
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <Headphones className="w-4 h-4 text-[#093C5D]" />
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                    {t('Support & Visibility')}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                      {t('Support Level Tier')}
                    </label>
                    <select
                      value={supportTier}
                      onChange={(e) => setSupportTier(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem',
                      }}
                    >
                      {SUPPORT_TIERS.map((tier) => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 font-medium mt-1.5">
                      {t('SLA & assistance level provided to store merchants')}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Recommended Tier Tile */}
                    <div
                      onClick={() => setIsRecommended(!isRecommended)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                        isRecommended
                          ? 'border-[#093C5D] bg-[#093C5D]/[0.05]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                      }`}
                    >
                      <ThemeCheckbox checked={isRecommended} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#093C5D]">
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
                          <span>{t('Highlight as Recommended Tier')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-snug">
                          {t('Displays top banner and highlights card on pricing tables')}
                        </p>
                      </div>
                    </div>

                    {/* Active Tier Tile */}
                    <div
                      onClick={() => setIsActive(!isActive)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                        isActive
                          ? 'border-[#093C5D] bg-[#093C5D]/[0.05]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                      }`}
                    >
                      <ThemeCheckbox checked={isActive} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-gray-900">
                          <span>{t('Active & Purchasable by Storekeepers')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-snug">
                          {t('Available for stores to upgrade or subscribe')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Feature Highlights List Card */}
              <div className="p-4 sm:p-5 rounded-lg border border-gray-200 bg-white space-y-3.5 shadow-none">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#093C5D]" />
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                      {t('Marketing Feature Highlights')}
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    ({features.length}/10)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder={t('e.g. Priority WhatsApp Gateway')}
                    className="flex-1 block w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="cursor-pointer h-9 sm:h-10 px-4 bg-[#093C5D] text-white hover:bg-[#072d46] rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95 flex items-center gap-1.5 shrink-0 shadow-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('Add')}</span>
                  </button>
                </div>

                {features.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-[13px] text-gray-700 font-medium"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Check className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="cursor-pointer p-1 text-gray-400 hover:text-red-600 rounded transition-colors shrink-0"
                          title={t('Remove')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── Modal Footer (Pinned at Bottom, Never Overlaps) ── */}
            <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              {/* Changes Status Indicator (Same as Settings Page) */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={
                    hasChanges
                      ? 'text-amber-700 font-medium'
                      : 'text-gray-500 font-medium'
                  }
                >
                  {hasChanges
                    ? t('You have unsaved changes')
                    : t('All changes saved')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="cursor-pointer h-10 px-4 sm:px-5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-none disabled:opacity-50 flex-1 sm:flex-initial inline-flex items-center justify-center"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || saving}
                  className={`h-10 px-5 sm:px-6 rounded-lg bg-[#093C5D] text-white text-xs sm:text-sm font-medium transition-all shadow-none flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                    !hasChanges || saving
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-[#072d46] active:scale-95'
                  }`}
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {saving ? t('Updating Tier...') : t('Save Plan Settings')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlanModal;

