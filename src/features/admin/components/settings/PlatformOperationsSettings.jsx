import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToggleSwitch from './ToggleSwitch';
import SettingSaveButton from './SettingSaveButton';

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
      {/* ── Merchant Signups & Quotas Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Store Onboarding & Default Quotas')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Control new signups and default free tier usage allowances')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 space-y-5">
          <ToggleSwitch
            name="allowNewRegistrations"
            checked={formData.allowNewRegistrations}
            onChange={handleChange}
            label={t('Allow New Store Registrations')}
            description={t('Keep ON to allow public merchant signups; turn OFF to pause new store onboarding')}
          />

          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {/* Default Free Trial */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Default Free Trial (Days)')}
                </label>
                <input
                  type="number"
                  name="defaultFreeTrialDays"
                  value={formData.defaultFreeTrialDays}
                  onChange={handleNumberChange}
                  min={0}
                  max={90}
                  placeholder="7"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
                <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Free Pro trial granted to new merchants upon signup')}
                </p>
              </div>

              {/* Free Monthly Bills */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Free Plan Monthly Bills')}
                </label>
                <input
                  type="number"
                  name="freePlanMonthlyBillLimit"
                  value={formData.freePlanMonthlyBillLimit}
                  onChange={handleNumberChange}
                  min={0}
                  placeholder="5"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
                <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Maximum bills allowed per month on Free tier')}
                </p>
              </div>

              {/* Free Plan Customer Limit */}
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Free Plan Customer Quota')}
                </label>
                <input
                  type="number"
                  name="freePlanCustomerLimit"
                  value={formData.freePlanCustomerLimit}
                  onChange={handleNumberChange}
                  min={0}
                  placeholder="2"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
                <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('Maximum customer profiles allowed on Free tier')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Sticky Save Button Bar */}
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
