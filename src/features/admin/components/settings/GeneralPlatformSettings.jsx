import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SettingSaveButton from './SettingSaveButton';

const GeneralPlatformSettings = ({ settings, onUpdate, isUpdating }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    companyAddress: '',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
  });

  const [initialData, setInitialData] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    companyAddress: '',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    if (settings) {
      const data = {
        platformName: settings.platformName || 'UdharPay',
        supportEmail: settings.supportEmail || 'support@udharpay.in',
        supportPhone: settings.supportPhone || '+91 9876543210',
        companyAddress: settings.companyAddress || 'New Delhi, India',
        defaultCurrency: settings.defaultCurrency || 'INR',
        currencySymbol: settings.currencySymbol || '₹',
        timezone: settings.timezone || 'Asia/Kolkata',
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, t('General platform settings updated successfully'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/* ── Platform Brand & Locale Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Platform Brand & Locale')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Core platform branding, identification and localization')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Platform Display Name */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Platform Display Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="platformName"
                value={formData.platformName}
                onChange={handleChange}
                required
                placeholder="UdharPay"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Shown in emails, invoices and dashboard branding')}
              </p>
            </div>

            {/* Default System Timezone */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Default System Timezone')}
              </label>
              <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                placeholder="Asia/Kolkata"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Used for billing cycle dates, midnight settlement and reports')}
              </p>
            </div>

            {/* Base Currency Code */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Base Currency')}
              </label>
              <select
                name="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] appearance-none bg-white cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="AED">AED — UAE Dirham (د.إ)</option>
              </select>
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Default currency used for store plans and billing')}
              </p>
            </div>

            {/* Currency Symbol Prefix */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Currency Symbol Prefix')}
              </label>
              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                maxLength={4}
                placeholder="₹"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Symbol displayed before monetary figures (e.g. ₹ or $)')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Support & Legal Details Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Official Support & Legal Details')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Customer-facing contacts displayed on public invoices and receipts')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Support Email */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Official Support Email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                required
                placeholder="support@udharpay.in"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Merchants will receive notifications and reach out on this email')}
              </p>
            </div>

            {/* Support Phone */}
            <div>
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Helpline Phone Number')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleChange}
                required
                placeholder="+91 98765 43210"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Customer support phone number for merchant queries')}
              </p>
            </div>

            {/* Company Address */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                {t('Official Registered Address')}
              </label>
              <textarea
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                rows={3}
                placeholder="123, Cyber City, Phase 2, Gurugram, Haryana - 122002"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] resize-none"
              />
              <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                {t('Official legal address printed on public invoices and receipts')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Sticky Save Button Bar */}
      <SettingSaveButton
        isUpdating={isUpdating}
        hasChanges={hasChanges}
        label="Save Platform Settings"
        loadingLabel="Saving Changes..."
      />
    </form>
  );
};

export default GeneralPlatformSettings;
