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
      className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        plan.isRecommended
          ? 'border-indigo-400 ring-2 ring-indigo-500/10'
          : 'border-gray-200/90'
      }`}
    >
      {/* Recommended Top Banner */}
      {plan.isRecommended && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider py-1 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm">
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>Recommended Choice</span>
        </div>
      )}

      {/* Card Header & Content */}
      <div className="p-6 space-y-5 flex-1">
        {/* Tier Title & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {plan.name}
              </h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold border border-gray-200">
                {plan.planId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {plan.description || 'Configured SaaS subscription tier'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {plan.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {plan.badge}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                plan.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {plan.isActive ? 'Active for Stores' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-gray-900">
              ₹{plan.price}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              / {plan.billingCycleDays} Days
            </span>
          </div>
          {isFree && plan.trialDays > 0 && (
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              Includes {plan.trialDays}-day full operational trial
            </p>
          )}
        </div>

        {/* Operational Quotas */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium mb-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Customer Quota</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              {plan.maxCustomers === -1 ? 'Unlimited' : `${plan.maxCustomers} Customers`}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Billing Quota</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              {plan.maxBills === -1 ? 'Unlimited' : `${plan.maxBills} Invoices`}
            </p>
          </div>
        </div>

        {/* Core Feature Switches */}
        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
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
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Marketing Bulletpoints
            </p>
            <ul className="space-y-1">
              {plan.features.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Card Footer: Subscriber Count & Edit Button */}
      <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-gray-400 block text-[11px]">Subscribed Stores</span>
          <span className="font-bold text-gray-900">
            {plan.subscriberCount || 0} Stores
          </span>
        </div>

        <button
          onClick={() => onEdit(plan)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Configure</span>
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
