import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  Sparkles,
  Calendar,
  Layers,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_PLANS = [
  { id: 'MONTHLY', label: 'Monthly Pro (₹299)' },
  { id: 'QUARTERLY', label: 'Quarterly Pro (₹799)' },
  { id: 'YEARLY', label: 'Yearly Pro (₹2999)' },
];

const RANDOM_PREFIXES = ['SAVE', 'FESTIVE', 'SPECIAL', 'PROMO', 'UDHAR', 'LAUNCH'];

const CouponModal = ({ isOpen, coupon, onClose, onSave }) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [applicablePlans, setApplicablePlans] = useState(['MONTHLY', 'QUARTERLY', 'YEARLY']);
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code || '');
      setDescription(coupon.description || '');
      setDiscountType(coupon.discountType || 'PERCENTAGE');
      setDiscountValue(coupon.discountValue || 20);
      setMaxDiscountAmount(coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined ? coupon.maxDiscountAmount : '');
      setMinOrderAmount(coupon.minOrderAmount || 0);
      setApplicablePlans(coupon.applicablePlans || ['MONTHLY', 'QUARTERLY', 'YEARLY']);
      setUsageLimit(coupon.usageLimit !== null && coupon.usageLimit !== undefined ? coupon.usageLimit : '');
      setPerUserLimit(coupon.perUserLimit || 1);
      setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '');
      setIsActive(coupon.isActive !== undefined ? coupon.isActive : true);
    } else {
      setCode('');
      setDescription('');
      setDiscountType('PERCENTAGE');
      setDiscountValue(20);
      setMaxDiscountAmount('');
      setMinOrderAmount(0);
      setApplicablePlans(['MONTHLY', 'QUARTERLY', 'YEARLY']);
      setUsageLimit('');
      setPerUserLimit(1);
      setExpiresAt('');
      setIsActive(true);
    }
  }, [coupon]);

  const handleGenerateCode = () => {
    const prefix = RANDOM_PREFIXES[Math.floor(Math.random() * RANDOM_PREFIXES.length)];
    const num = discountType === 'PERCENTAGE' ? discountValue || 25 : Math.floor(100 + Math.random() * 400);
    setCode(`${prefix}${num}`);
  };

  const handleTogglePlan = (planId) => {
    setApplicablePlans((prev) =>
      prev.includes(planId) ? prev.filter((p) => p !== planId) : [...prev, planId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (applicablePlans.length === 0) {
      toast.error('Select at least one applicable plan');
      return;
    }

    if (expiresAt) {
      const expDate = new Date(expiresAt);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (expDate < todayStart) {
        toast.error('Coupon expiration date cannot be in the past');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minOrderAmount: Number(minOrderAmount) || 0,
        applicablePlans,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      };

      await onSave(payload, coupon?._id);
      toast.success(coupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                {coupon ? 'Edit Coupon Code' : 'Create New Promo Code'}
              </h3>
              <p className="text-xs text-gray-500">
                Configure discount rules and plan eligibility for merchant checkout
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Form: 7 Columns */}
          <form onSubmit={handleSubmit} id="coupon-form" className="lg:col-span-7 p-6 space-y-4">
            {/* Coupon Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">Coupon Code *</label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="cursor-pointer text-xs font-medium text-[#093C5D] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. DIWALI50 or SAVE20"
                className="w-full text-sm font-mono font-bold tracking-wider px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none uppercase"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 50% discount on Yearly Pro subscriptions"
                className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-white text-[#093C5D] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FLAT')}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      discountType === 'FLAT'
                        ? 'bg-white text-[#093C5D] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Flat Cash (₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'PERCENTAGE' ? 100 : 5000}
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
                />
              </div>
            </div>

            {/* Max Discount & Min Order Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {discountType === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="No cap (e.g. 500)"
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0 (no minimum)"
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
                />
              </div>
            </div>

            {/* Applicable Plans */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Eligible Plans *
              </label>
              <div className="space-y-2">
                {AVAILABLE_PLANS.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={applicablePlans.includes(p.id)}
                      onChange={() => handleTogglePlan(p.id)}
                      className="rounded text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Unlimited (e.g. 100)"
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Per-Merchant Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
              />
            </div>
          </form>

          {/* Right Live Voucher Preview: 5 Columns */}
          <div className="lg:col-span-5 bg-gray-50/70 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col justify-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Live Voucher Preview
            </span>

            {/* Live Voucher Card */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#093C5D]/30 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#093C5D]/10 text-[#093C5D]">
                  Special Promo
                </span>
                <span className="text-xs text-gray-400">UdharPay SaaS</span>
              </div>

              <div>
                <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {discountType === 'PERCENTAGE'
                    ? `${discountValue || 0}% OFF`
                    : `₹${discountValue || 0} FLAT`}
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  {description || 'Get instant savings on subscription upgrades'}
                </p>
              </div>

              {/* Code Box */}
              <div className="p-2.5 bg-gray-100 rounded-xl flex items-center justify-between">
                <span className="font-mono font-bold text-sm tracking-wider text-[#093C5D]">
                  {code || 'ENTER_CODE'}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Valid at Checkout</span>
              </div>

              <div className="space-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-3">
                <p>
                  • Applies to: {applicablePlans.length > 0 ? applicablePlans.join(', ') : 'None'}
                </p>
                {maxDiscountAmount && discountType === 'PERCENTAGE' && (
                  <p>• Maximum savings capped at ₹{maxDiscountAmount}</p>
                )}
                {expiresAt && <p>• Valid until: {expiresAt}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded text-[#093C5D] focus:ring-[#093C5D] w-4 h-4"
            />
            <span>Active immediately upon saving</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="coupon-form"
              disabled={saving}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#093C5D] hover:bg-[#072C44] px-4 py-2 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponModal;
