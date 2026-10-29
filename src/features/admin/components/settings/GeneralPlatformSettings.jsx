/**
 * General Platform Identity & Support Contact Settings
 * Manages official application brand name, support hotline number, email desk, and headquarters address.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SettingSaveButton from './SettingSaveButton';

/**
 * GeneralPlatformSettings Component
 */
const GeneralPlatformSettings = ({ settings, onUpdate, isUpdating }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    companyAddress: '',
  });

  const [initialData, setInitialData] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    companyAddress: '',
  });

  useEffect(() => {
    if (settings) {
      const data = {
        platformName: settings.platformName || 'UdharPay',
        supportEmail: settings.supportEmail || 'support@udharpay.in',
        supportPhone: settings.supportPhone || '+91 9876543210',
        companyAddress: settings.companyAddress || 'New Delhi, India',
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
      {/**
       * Platform Details Card Section
       * Core platform branding and naming configurations.
       */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Platform Details')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Core platform branding and identification')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <div className="max-w-xl">
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
              {t('Shown in emails, invoices, receipts and dashboard branding')}
            </p>
          </div>
        </div>
      </section>

      {/**
       * Official Support & Legal Details Card Section
       * Public support contact email, phone helpline, and registered address.
       */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Official Support & Legal Details')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Customer-facing contacts displayed on public invoices and receipts')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/**
             * Support Email Input
             * Merchant support and inbound notification destination.
             */}
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

            {/**
             * Support Phone Input
             * Helpline telephone number for urgent merchant queries.
             */}
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

            {/**
             * Company Address Input
             * Registered legal entity address printed on merchant invoices.
             */}
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

      {/**
       * Floating Sticky Save Button Bar
       * Triggers platform configuration persistence with loading state.
       */}
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
