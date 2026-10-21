import React from 'react';
import {
  Check,
  X as CloseIcon,
  Crown,
  Sparkles,
  Users,
  FileText,
  Clock,
  Edit3,
  Layers,
  MessageCircle,
  Mic,
  BarChart2,
} from 'lucide-react';

const PlanCard = ({ plan, onEdit }) => {
  const isFree = plan.planId === 'FREE';

  return (
    <div
      className={`relative bg-white rounded-lg border transition-all duration-200 flex flex-col justify-between overflow-hidden hover:border-gray-300 ${
        plan.isRecommended
          ? 'border-[#093C5D] ring-1 ring-[#093C5D]/30'
          : 'border-gray-200'
      }`}
    >
      {/* Recommended Top Banner */}
      {plan.isRecommended && (
        <div className="bg-[#093C5D] text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider py-1 px-4 text-center flex items-center justify-center gap-1.5">
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>Recommended Choice</span>
        </div>
      )}

      {/* Card Header & Content */}
      <div className="p-4 sm:p-5 space-y-4 flex-1">
        {/* Tier Title & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
                {plan.name}
              </h3>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                {plan.planId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 font-medium">
              {plan.description || 'Configured SaaS subscription tier'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {plan.badge && (
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {plan.badge}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                plan.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {plan.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              ₹{plan.price}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              / {plan.billingCycleDays} Days
            </span>
          </div>
          {isFree && plan.trialDays > 0 && (
            <p className="text-xs text-[#093C5D] font-medium mt-0.5">
              Includes {plan.trialDays}-day full operational trial
            </p>
          )}
        </div>

        {/* Operational Quotas */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#F5F5F5] rounded-lg p-2.5 sm:p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-semibold mb-1 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5 text-[#093C5D]" />
              <span>Cust. Limit</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">
              {plan.maxCustomers === -1 ? 'Unlimited' : `${plan.maxCustomers} Cust`}
            </p>
          </div>

          <div className="bg-[#F5F5F5] rounded-lg p-2.5 sm:p-3 border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-semibold mb-1 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bill Limit</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">
              {plan.maxBills === -1 ? 'Unlimited' : `${plan.maxBills} Bills`}
            </p>
          </div>
        </div>

        {/* Core Feature Switches */}
        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs font-medium">
          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Reminders</span>
            </span>
            {plan.hasWhatsAppReminders ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300" />
            )}
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Billing</span>
            </span>
            {plan.hasVoiceBilling ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300" />
            )}
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Advanced Analytics</span>
            </span>
            {plan.hasAdvancedAnalytics ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300" />
            )}
          </div>
        </div>

        {/* Feature Bullets */}
        {plan.features && plan.features.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Included Highlights
            </p>
            <ul className="space-y-1">
              {plan.features.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-600 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#093C5D] shrink-0" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Card Footer: Subscriber Count & Edit Button */}
      <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-gray-500 block text-[10px] font-medium">Subscribed Stores</span>
          <span className="font-semibold text-gray-900">
            {plan.subscriberCount || 0} Stores
          </span>
        </div>

        <button
          onClick={() => onEdit(plan)}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#093C5D] bg-white border border-[#093C5D]/20 hover:bg-[#093C5D]/5 rounded transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Configure</span>
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
