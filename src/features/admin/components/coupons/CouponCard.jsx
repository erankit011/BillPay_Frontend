/**
 * SaaS Discount Coupon Promotional Card
 * Displays voucher promo code, discount type, redemption quota progress bar, and validity windows.
 */

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
import { formatShortDate, isDateExpired } from '../../../../utils/dateUtils';

/**
 * CouponCard Component
 */
const CouponCard = ({ coupon, onEdit, onToggleActive, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`Coupon code ${coupon.code} copied!`);
  };

  const isExpired = isDateExpired(coupon.expiresAt);
  const isStarted = !coupon.startsAt || new Date(coupon.startsAt) <= new Date();

  /**
   * Redemptions Ratio Calculation
   * Computes percentage ratio of redeemed coupons against max allocation threshold.
   */
  const usedCount = Number(coupon.usedCount) || 0;
  const usageLimit = Number(coupon.usageLimit) || null;
  const usagePercentage = usageLimit && usageLimit > 0
    ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
    : null;

  const formatDate = (d) => (!d ? 'Never' : (formatShortDate(d) || 'Never'));

  return (
    <div
      className={`relative bg-[#FBFBFC] rounded-lg border transition-all duration-200 overflow-hidden hover:border-[#C2C9D6] ${
        !coupon.isActive
          ? 'border-[#DCE1EA] opacity-75'
          : isExpired
          ? 'border-amber-200 bg-amber-50/10'
          : 'border-[#DCE1EA]'
      }`}
    >
      {/**
       * Banner Header
       * Displays discount amount badge, promotional description, and active status tag.
       */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-dashed border-[#DCE1EA]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              coupon.discountType === 'PERCENTAGE'
                ? 'bg-[#EEF0FB] text-[#4338CA] border-[#D8DCF5]'
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
              <span className="text-lg sm:text-xl font-semibold tracking-tight text-[#191E2B]">
                {coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}% OFF`
                  : `₹${coupon.discountValue} FLAT`}
              </span>
              {coupon.maxDiscountAmount && coupon.discountType === 'PERCENTAGE' && (
                <span className="text-[10px] font-semibold text-[#4E5668] bg-gray-100 px-1.5 py-0.5 rounded border border-[#DCE1EA]">
                  Upto ₹{coupon.maxDiscountAmount}
                </span>
              )}
            </div>
            <p className="text-xs text-[#757F94] mt-0.5 line-clamp-1 font-medium">
              {coupon.description || 'Promotional coupon code'}
            </p>
          </div>
        </div>

        {/**
         * Operational Status Tag
         * Visual chip indicating expired, paused, scheduled, or active status.
         */}
        <div>
          {isExpired ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 uppercase tracking-wide">
              <Clock className="w-3 h-3" />
              Expired
            </span>
          ) : !coupon.isActive ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-[#4E5668] border border-[#DCE1EA] uppercase tracking-wide">
              <PauseCircle className="w-3 h-3" />
              Paused
            </span>
          ) : !isStarted ? (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
              <AlertCircle className="w-3 h-3" />
              Scheduled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      {/**
       * Promo Code Voucher Frame
       * Dashed code container with single-click clipboard copy utility button.
       */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 p-2.5 bg-[#F0F2F6] rounded-lg border border-dashed border-[#DCE1EA]">
          <div className="flex items-center gap-2 overflow-hidden">
            <Tag className="w-4 h-4 text-[#4338CA] shrink-0" />
            <span className="font-mono font-semibold text-[#191E2B] tracking-wider text-sm truncate">
              {coupon.code}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:text-[#072C44] px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#DCE1EA] hover:border-[#DCE1EA] transition-all active:scale-95 shrink-0 shadow-none"
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

        {/**
         * Eligible Subscription Plans
         * List of subscription tier tags for which this coupon discount is applicable.
         */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#757F94] uppercase tracking-wider">
            Valid For Plans
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {coupon.applicablePlans && coupon.applicablePlans.length > 0 ? (
              coupon.applicablePlans.map((plan) => (
                <span
                  key={plan}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-[#4E5668] border border-[#DCE1EA]"
                >
                  {plan}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#757F94] font-medium">All SaaS Subscription Plans</span>
            )}
          </div>
        </div>

        {/**
         * Redemption Quota Progress
         * Progress bar and textual counts for used coupons versus maximum limit.
         */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#4E5668]">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-[#757F94]" />
              Redemptions
            </span>
            <span className="font-semibold text-[#191E2B]">
              {coupon.usedCount}{' '}
              <span className="font-normal text-[#757F94]">
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
                    : 'bg-[#4338CA]'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
        </div>

        {/**
         * Temporal Validity & Criteria
         * Expiration date and minimum order purchase threshold requirements.
         */}
        <div className="flex items-center justify-between text-[11px] text-[#757F94] pt-1 border-t border-[#E8ECF2] font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#757F94]" />
            Expires: {formatDate(coupon.expiresAt)}
          </span>
          {coupon.minOrderAmount > 0 && (
            <span>Min Order: ₹{coupon.minOrderAmount}</span>
          )}
        </div>
      </div>

      {/**
       * Action Toolbar
       * Pause/activate toggle switch and edit/delete coupon controls.
       */}
      <div className="px-4 py-3 bg-[#F0F2F6] border-t border-[#DCE1EA] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onToggleActive(coupon._id)}
          className={`cursor-pointer font-semibold transition-all active:scale-95 px-2 py-1 rounded-md ${
            coupon.isActive
              ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
              : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
          }`}
        >
          {coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(coupon)}
            className="cursor-pointer p-1.5 text-[#757F94] hover:text-[#4338CA] hover:bg-[#FBFBFC] rounded-md transition-all active:scale-95 border border-transparent hover:border-[#DCE1EA]"
            title="Edit Coupon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(coupon._id, coupon.code)}
            className="cursor-pointer p-1.5 text-[#757F94] hover:text-rose-600 hover:bg-[#FBFBFC] rounded-md transition-all active:scale-95 border border-transparent hover:border-[#DCE1EA]"
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
