import React, { useState, useEffect } from 'react';
import { Globe, Mail, Phone, MapPin, DollarSign, Clock } from 'lucide-react';
import SettingCardHeader from './SettingCardHeader';
import SettingSaveButton from './SettingSaveButton';

const GeneralPlatformSettings = ({ settings, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState({
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
      setFormData({
        platformName: settings.platformName || 'UdharPay',
        supportEmail: settings.supportEmail || 'support@udharpay.in',
        supportPhone: settings.supportPhone || '+91 9876543210',
        companyAddress: settings.companyAddress || 'New Delhi, India',
        defaultCurrency: settings.defaultCurrency || 'INR',
        currencySymbol: settings.currencySymbol || '₹',
        timezone: settings.timezone || 'Asia/Kolkata',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, 'General platform settings updated successfully');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <SettingCardHeader
          icon={Globe}
          title="Platform Brand & Locale"
          subtitle="Core platform identification and localization parameters"
          iconBg="bg-[#093C5D]/10"
          iconColor="text-[#093C5D]"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Platform Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Platform Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="platformName"
              value={formData.platformName}
              onChange={handleChange}
              required
              placeholder="e.g. UdharPay"
              className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Default System Timezone
            </label>
            <div className="relative">
              <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                placeholder="Asia/Kolkata"
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <Clock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Currency Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Base Currency Code
            </label>
            <select
              name="defaultCurrency"
              value={formData.defaultCurrency}
              onChange={handleChange}
              className="w-full h-10 px-3 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium cursor-pointer"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Currency Symbol Prefix
            </label>
            <div className="relative">
              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                maxLength={4}
                placeholder="₹"
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <DollarSign className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Support & Corporate Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <SettingCardHeader
          icon={Mail}
          title="Official Support & Legal Details"
          subtitle="Customer-facing contacts displayed on public invoices and receipts"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Support Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Official Support Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                required
                placeholder="support@udharpay.in"
                className="w-full h-10 pl-9 pr-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Support Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Helpline Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="supportPhone"
                value={formData.supportPhone}
                onChange={handleChange}
                required
                placeholder="+91 9876543210"
                className="w-full h-10 pl-9 pr-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Company Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Official Registered Address
            </label>
            <div className="relative">
              <input
                type="text"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                placeholder="HQ Building, Cyber City, Gurugram, India"
                className="w-full h-10 pl-9 pr-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <SettingSaveButton
        isUpdating={isUpdating}
        label="Save Platform Settings"
        loadingLabel="Saving Changes..."
      />
    </form>
  );
};

export default GeneralPlatformSettings;
