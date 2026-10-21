import React, { useState } from 'react';
import {
  Tag,
  Copy,
  Check,
  Calendar,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  PauseCircle,
  Clock,
  AlertCircle,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CouponCard = ({ coupon, onEdit, onToggleActive, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`Coupon code ${coupon.code} copied!`);
  };

  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isStarted = !coupon.startsAt || new Date(coupon.startsAt) <= new Date();

  // Usage percentage
  const usedCount = Number(coupon.usedCount) || 0;
  const usageLimit = Number(coupon.usageLimit) || null;
  const usagePercentage = usageLimit && usageLimit > 0
    ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
    : null;

  const formatDate = (d) => {
    if (!d) return 'Never';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return 'Never';
    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`relative bg-white rounded-lg border transition-all duration-200 overflow-hidden hover:border-gray-300 ${
        !coupon.isActive
          ? 'border-gray-200 opacity-75'
          : isExpired
          ? 'border-amber-200 bg-amber-50/10'
          : 'border-gray-200'
      }`}
    >
      {/* Top Banner: Discount Value & Status */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-dashed border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              coupon.discountType === 'PERCENTAGE'
                ? 'bg-blue-50 text-[#093C5D] border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {coupon.discountType === 'PERCENTAGE' ? (
              <Percent className="w-5 h-5" />
            ) : (
              <span className="text-lg font-semibold">₹</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900">
                {coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}% OFF`
                  : `₹${coupon.discountValue} FLAT`}
              </span>
              {coupon.maxDiscountAmount && coupon.discountType === 'PERCENTAGE' && (
                <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                  Upto ₹{coupon.maxDiscountAmount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium">
              {coupon.description || 'Promotional coupon code'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isExpired ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
              <Clock className="w-3 h-3" />
              Expired
            </span>
          ) : !coupon.isActive ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
              <PauseCircle className="w-3 h-3" />
              Paused
            </span>
          ) : !isStarted ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
              <AlertCircle className="w-3 h-3" />
              Scheduled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <Tag className="w-4 h-4 text-[#093C5D] shrink-0" />
            <span className="font-mono font-semibold text-gray-900 tracking-wider text-sm truncate">
              {coupon.code}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-[#093C5D] hover:text-[#072C44] px-2 py-1 rounded bg-white border border-gray-200 hover:border-gray-300 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Applicable Plans */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Valid For Plans
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {coupon.applicablePlans && coupon.applicablePlans.length > 0 ? (
              coupon.applicablePlans.map((plan) => (
                <span
                  key={plan}
                  className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {plan}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">All SaaS Plans</span>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              Redemptions
            </span>
            <span className="font-semibold text-gray-900">
              {coupon.usedCount}{' '}
              <span className="font-normal text-gray-500">
                / {coupon.usageLimit ? `${coupon.usageLimit} max` : 'Unlimited'}
              </span>
            </span>
          </div>

          {usagePercentage !== null && (
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercentage >= 90
                    ? 'bg-rose-500'
                    : usagePercentage >= 60
                    ? 'bg-amber-500'
                    : 'bg-[#093C5D]'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Validity Dates */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Expires: {formatDate(coupon.expiresAt)}
          </span>
          {coupon.minOrderAmount > 0 && (
            <span>Min Order: ₹{coupon.minOrderAmount}</span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onToggleActive(coupon._id)}
          className={`cursor-pointer font-medium transition-colors ${
            coupon.isActive
              ? 'text-amber-700 hover:text-amber-900'
              : 'text-emerald-700 hover:text-emerald-900'
          }`}
        >
          {coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(coupon)}
            className="cursor-pointer p-1.5 text-gray-500 hover:text-[#093C5D] hover:bg-white rounded transition-colors"
            title="Edit Coupon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(coupon._id, coupon.code)}
            className="cursor-pointer p-1.5 text-gray-500 hover:text-rose-600 hover:bg-white rounded transition-colors"
            title="Delete Coupon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
