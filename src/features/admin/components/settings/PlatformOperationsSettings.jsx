/**
 * Platform Operational Limits & Registration Policies
 * Configures new merchant onboarding permissions, default trial duration, and baseline free-tier quotas.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToggleSwitch from './ToggleSwitch';
import SettingSaveButton from './SettingSaveButton';

/**
 * PlatformOperationsSettings Component
 */
const PlatformOperationsSettings = ({ settings, onUpdate, isUpdating }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    allowNewRegistrations: true,
    defaultFreeTrialDays: 7,
    freePlanMonthlyBillLimit: 5,
    freePlanCustomerLimit: 2,
  });

  const [initialData, setInitialData] = useState({
    allowNewRegistrations: true,
    defaultFreeTrialDays: 7,
    freePlanMonthlyBillLimit: 5,
    freePlanCustomerLimit: 2,
  });

  useEffect(() => {
    if (settings) {
      const data = {
        allowNewRegistrations: settings.allowNewRegistrations !== false,
        defaultFreeTrialDays: settings.defaultFreeTrialDays ?? 7,
        freePlanMonthlyBillLimit: settings.freePlanMonthlyBillLimit ?? 5,
        freePlanCustomerLimit: settings.freePlanCustomerLimit ?? 2,
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Math.max(0, parseInt(value, 10) || 0),
    }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, t('Operations and store quota settings updated successfully'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/**
       * Merchant Signups & Quotas Card Section
       * Manages public signup permissions, default trial period, and free plan quota caps.
       */}
      <section className="bg-[#FFFFFF] rounded-lg border border-[#DCE1EA] overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-[#E8ECF2]">
          <h2 className="text-base md:text-lg font-semibold text-[#191E2B]">{t('Store Onboarding & Default Quotas')}</h2>
          <p className="text-xs text-[#757F94] mt-0.5">{t('Control new signups and default free tier usage allowances')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 space-y-5">
          <ToggleSwitch
            name="allowNewRegistrations"
            checked={formData.allowNewRegistrations}
            onChange={handleChange}
            label={t('Allow New Store Registrations')}
            description={t('Keep ON to allow public merchant signups; turn OFF to pause new store onboarding')}
          />

          <div className="pt-2 border-t border-[#E8ECF2]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {/**
               * Default Free Trial Input
               * Duration in days of complimentary Pro tier access for new stores.
               */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                  {t('Default Free Trial (Days)')}
                </label>
                <input
                  type="number"
                  name="defaultFreeTrialDays"
                  value={formData.defaultFreeTrialDays}
                  onChange={handleNumberChange}
                  min={0}
                  max={90}
                  step={1}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="7"
                  className="block w-full rounded-lg border border-[#DCE1EA] bg-[#FBFBFC] px-3 py-2.5 text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                />
                <p className="text-[#757F94] text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Free Pro trial granted to new merchants upon signup')}
                </p>
              </div>

              {/**
               * Free Monthly Bills Quota Input
               * Cap on invoice generation per calendar month for Free tier merchants.
               */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                  {t('Free Plan Monthly Bills')}
                </label>
                <input
                  type="number"
                  name="freePlanMonthlyBillLimit"
                  value={formData.freePlanMonthlyBillLimit}
                  onChange={handleNumberChange}
                  min={0}
                  step={1}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="5"
                  className="block w-full rounded-lg border border-[#DCE1EA] bg-[#FBFBFC] px-3 py-2.5 text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                />
                <p className="text-[#757F94] text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Maximum bills allowed per month on Free tier')}
                </p>
              </div>

              {/**
               * Free Plan Customer Limit Input
               * Maximum customer ledger records allowed on Free tier accounts.
               */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                  {t('Free Plan Customer Quota')}
                </label>
                <input
                  type="number"
                  name="freePlanCustomerLimit"
                  value={formData.freePlanCustomerLimit}
                  onChange={handleNumberChange}
                  min={0}
                  step={1}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="2"
                  className="block w-full rounded-lg border border-[#DCE1EA] bg-[#FBFBFC] px-3 py-2.5 text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                />
                <p className="text-[#757F94] text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Maximum customer profiles allowed on Free tier')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/**
       * Floating Sticky Save Button Bar
       * Persists onboarding rules and quota limit modifications.
       */}
      <SettingSaveButton
        isUpdating={isUpdating}
        hasChanges={hasChanges}
        label="Save Operations Config"
        loadingLabel="Saving Changes..."
      />
    </form>
  );
};

export default PlatformOperationsSettings;
