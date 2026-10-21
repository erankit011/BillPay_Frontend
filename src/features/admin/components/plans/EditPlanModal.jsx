import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Crown,
  Check,
  Tag,
  Clock,
  Users,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUPPORT_TIERS = [
  { value: 'COMMUNITY', label: 'Community Support' },
  { value: 'EMAIL', label: 'Standard Email Support' },
  { value: 'PRIORITY', label: 'Priority Support (Fast Response)' },
  { value: 'DEDICATED', label: '24/7 Dedicated Account Manager' },
];

const EditPlanModal = ({ isOpen, plan, onClose, onSave }) => {
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

  useEffect(() => {
    if (!isOpen || !plan) return;
    setName(plan.name || '');
    setDescription(plan.description || '');
    setPrice(plan.price ?? 0);
    setBillingCycleDays(plan.billingCycleDays || 30);
    setUnlimitedCustomers(plan.maxCustomers === -1);
    setMaxCustomers(plan.maxCustomers === -1 ? 100 : plan.maxCustomers);
    setUnlimitedBills(plan.maxBills === -1);
    setMaxBills(plan.maxBills === -1 ? 500 : plan.maxBills);
    setTrialDays(plan.trialDays || 0);
    setBadge(plan.badge || '');
    setIsRecommended(Boolean(plan.isRecommended));
    setIsActive(Boolean(plan.isActive));
    setSupportTier(plan.supportTier || 'PRIORITY');
    setHasWhatsAppReminders(Boolean(plan.hasWhatsAppReminders));
    setHasVoiceBilling(Boolean(plan.hasVoiceBilling));
    setHasAdvancedAnalytics(Boolean(plan.hasAdvancedAnalytics));
    setFeatures(plan.features || []);
    setNewFeatureText('');
  }, [plan, isOpen]);

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    if (features.length >= 10) {
      toast.error('Maximum 10 feature bulletpoints allowed');
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
    if (!name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (price < 0) {
      toast.error('Price cannot be negative');
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Container: Bottom Sheet on Mobile, Centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div
          className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-gray-50/70">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex-shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded bg-[#093C5D]/10 border border-[#093C5D]/20 text-[#093C5D] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug truncate">
                    Configure Tier: {plan.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#093C5D] font-semibold border border-blue-200">
                    {plan.planId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-medium truncate">
                  Set live pricing, customer quotas, and merchant feature entitlements.
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
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plan Display Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Badge Label (e.g. Save 16%, Starter)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Leave empty for no badge"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short tagline shown below the title"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Pricing & Cycle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Billing Cycle (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={billingCycleDays}
                    onChange={(e) => setBillingCycleDays(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trial Period (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Operational Quotas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Quota */}
                <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Customer Limit</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                      <input
                        type="checkbox"
                        checked={unlimitedCustomers}
                        onChange={(e) => setUnlimitedCustomers(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Unlimited</span>
                    </label>
                  </div>
                  {!unlimitedCustomers && (
                    <input
                      type="number"
                      min="1"
                      value={maxCustomers}
                      onChange={(e) => setMaxCustomers(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Max allowed customers"
                    />
                  )}
                </div>

                {/* Bill Quota */}
                <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Invoices / Bills Limit</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                      <input
                        type="checkbox"
                        checked={unlimitedBills}
                        onChange={(e) => setUnlimitedBills(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Unlimited</span>
                    </label>
                  </div>
                  {!unlimitedBills && (
                    <input
                      type="number"
                      min="1"
                      value={maxBills}
                      onChange={(e) => setMaxBills(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Max allowed bills"
                    />
                  )}
                </div>
              </div>

              {/* Feature Entitlements & Switches */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Feature Entitlements & Switches
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-xs font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={hasWhatsAppReminders}
                      onChange={(e) => setHasWhatsAppReminders(e.target.checked)}
                      className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span>WhatsApp Alerts</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-xs font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={hasVoiceBilling}
                      onChange={(e) => setHasVoiceBilling(e.target.checked)}
                      className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span>Voice Billing</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-xs font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={hasAdvancedAnalytics}
                      onChange={(e) => setHasAdvancedAnalytics(e.target.checked)}
                      className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span>Advanced Analytics</span>
                  </label>
                </div>
              </div>

              {/* Visibility & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Support Level Tier
                  </label>
                  <select
                    value={supportTier}
                    onChange={(e) => setSupportTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all cursor-pointer"
                  >
                    {SUPPORT_TIERS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={isRecommended}
                      onChange={(e) => setIsRecommended(e.target.checked)}
                      className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span className="flex items-center gap-1 font-semibold text-[#093C5D]">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Highlight as Recommended Tier</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-300 text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span>Active & Purchasable by Storekeepers</span>
                  </label>
                </div>
              </div>

              {/* Bulletpoints List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Marketing Feature Highlights ({features.length}/10)
                </label>
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
                    placeholder="e.g. Priority WhatsApp Gateway"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="cursor-pointer px-3 py-2 bg-[#093C5D]/10 text-[#093C5D] hover:bg-[#093C5D]/20 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded bg-gray-50 border border-gray-100 text-xs text-gray-700 font-medium"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="cursor-pointer p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="cursor-pointer px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#093C5D] rounded hover:bg-[#072d46] transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Updating Tier...' : 'Save Plan Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlanModal;
