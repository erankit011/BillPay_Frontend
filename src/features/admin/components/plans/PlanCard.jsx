import React from 'react';
import {
  Check,
  X as CloseIcon,
  Crown,
  Users,
  FileText,
  Edit3,
  MessageCircle,
  Mic,
  BarChart2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PlanCard = ({ plan, onEdit }) => {
  const { t } = useTranslation();
  const isFree = plan.planId === 'FREE';

  return (
    <div
      className={`relative bg-white rounded-lg border flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-none h-full ${
        plan.isRecommended
          ? 'border-[#093C5D]'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* ── Top Banner (Recommended) or Desktop Alignment Spacer ── */}
      {plan.isRecommended ? (
        <div className="bg-[#093C5D] text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shrink-0">
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>{t('Recommended Choice')}</span>
        </div>
      ) : (
        <div className="hidden xl:block h-[31px] bg-transparent shrink-0" />
      )}

      {/* ── Card Main Content ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-4">
        {/* Tier Title & Status Row */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight whitespace-nowrap">
              {plan.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border whitespace-nowrap shrink-0 ${
                plan.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {plan.isActive ? t('Active') : t('Paused')}
            </span>
          </div>

          {/* Badges Row: Plan ID & Promo Badge */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
              {plan.planId}
            </span>
            {plan.badge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                {plan.badge}
              </span>
            )}
          </div>

          {/* Subtitle Description */}
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 font-medium min-h-[2.25rem] leading-relaxed">
            {plan.description || t('Configured SaaS subscription tier')}
          </p>
        </div>

        {/* Pricing Display */}
        <div className="pt-3 border-t border-gray-100 min-h-[4.25rem] flex flex-col justify-center">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              ₹{plan.price}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              / {plan.billingCycleDays} {t('Days')}
            </span>
          </div>
          {isFree && plan.trialDays > 0 ? (
            <p className="text-xs text-[#093C5D] font-medium mt-1 truncate">
              {t('Includes {{days}}-day free operational trial', { days: plan.trialDays })}
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium mt-1 truncate">
              {t('Full operational pro feature access')}
            </p>
          )}
        </div>

        {/* Operational Quotas */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-lg p-2.5 sm:p-3 border border-gray-200 shadow-none">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-medium mb-1 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
              <span className="truncate">{t('Cust. Limit')}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {plan.maxCustomers === -1 ? t('Unlimited') : `${plan.maxCustomers} Cust`}
            </p>
          </div>

          <div className="bg-gray-50/80 rounded-lg p-2.5 sm:p-3 border border-gray-200 shadow-none">
            <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-medium mb-1 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{t('Bill Limit')}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {plan.maxBills === -1 ? t('Unlimited') : `${plan.maxBills} Bills`}
            </p>
          </div>
        </div>

        {/* Core Feature Switches */}
        <div className="space-y-2 pt-3 border-t border-gray-100 text-xs font-medium">
          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5 truncate">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{t('WhatsApp Reminders')}</span>
            </span>
            {plan.hasWhatsAppReminders ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={1.5} />
            )}
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5 truncate">
              <Mic className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
              <span className="truncate">{t('Voice Billing')}</span>
            </span>
            {plan.hasVoiceBilling ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={1.5} />
            )}
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center gap-1.5 truncate">
              <BarChart2 className="w-3.5 h-3.5 text-[#093C5D] shrink-0" />
              <span className="truncate">{t('Advanced Analytics')}</span>
            </span>
            {plan.hasAdvancedAnalytics ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <CloseIcon className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {/* Feature Bullets / Highlights */}
        {plan.features && plan.features.length > 0 && (
          <div className="pt-3 border-t border-gray-100 flex-1 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {t('Included Highlights')}
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

      {/* ── Card Footer: Subscribed Stores & Configure Button ── */}
      <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0 shadow-none">
        <div className="text-xs">
          <span className="text-gray-500 block text-[10px] font-medium uppercase tracking-wider">
            {t('Subscribed Stores')}
          </span>
          <span className="font-semibold text-gray-900 text-xs sm:text-sm">
            {plan.subscriberCount || 0} {t('Stores')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="cursor-pointer h-8 px-3 rounded-lg bg-white border border-gray-300 hover:border-[#093C5D] hover:bg-[#093C5D]/5 text-gray-700 hover:text-[#093C5D] text-xs font-medium inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-none"
        >
          <Edit3 className="w-3.5 h-3.5 shrink-0" />
          <span>{t('Configure')}</span>
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
