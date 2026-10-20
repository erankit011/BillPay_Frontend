import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, Gift, FileText, Users } from 'lucide-react';
import SettingCardHeader from './SettingCardHeader';
import SettingSaveButton from './SettingSaveButton';

const PlatformOperationsSettings = ({ settings, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: '',
    allowNewRegistrations: true,
    defaultFreeTrialDays: 14,
    freePlanMonthlyBillLimit: 50,
    freePlanCustomerLimit: 30,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        isMaintenanceMode: Boolean(settings.isMaintenanceMode),
        maintenanceMessage:
          settings.maintenanceMessage ||
          'Platform is currently undergoing scheduled system maintenance. Please check back shortly.',
        allowNewRegistrations: settings.allowNewRegistrations !== false,
        defaultFreeTrialDays: settings.defaultFreeTrialDays ?? 14,
        freePlanMonthlyBillLimit: settings.freePlanMonthlyBillLimit ?? 50,
        freePlanCustomerLimit: settings.freePlanCustomerLimit ?? 30,
      });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, 'Operations and platform switches updated successfully');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Maintenance Mode Master Switch */}
      <div className={`border rounded-lg p-5 sm:p-6 transition-colors ${
        formData.isMaintenanceMode ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              formData.isMaintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                  Platform Maintenance Mode
                </h3>
                {formData.isMaintenanceMode && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                When active, store keepers see an informative maintenance banner during scheduled upgrades.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="isMaintenanceMode"
              checked={formData.isMaintenanceMode}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {formData.isMaintenanceMode && (
          <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-2">
            <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Public Maintenance Notice Message
            </label>
            <textarea
              name="maintenanceMessage"
              rows={2}
              value={formData.maintenanceMessage}
              onChange={handleChange}
              placeholder="Enter message visible to merchants..."
              className="w-full p-3 text-xs sm:text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 text-gray-900 font-medium leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 2. Merchant Signups & Trial Policy */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <SettingCardHeader
          icon={UserPlus}
          title="Onboarding & Registration Control"
          subtitle="Configure store registration eligibility and default trial allowances"
          iconBg="bg-blue-50"
          iconColor="text-[#093C5D]"
        />

        <div className="space-y-4">
          {/* Allow Registrations Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50/70 border border-gray-200/80">
            <div>
              <span className="text-sm font-semibold text-gray-900 block">Allow New Store Registrations</span>
              <span className="text-xs text-gray-500 font-medium">
                Keep ON to allow public merchant signups; turn OFF to temporarily pause new store onboarding.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                name="allowNewRegistrations"
                checked={formData.allowNewRegistrations}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#093C5D]"></div>
            </label>
          </div>

          {/* Trial Duration & Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                Default Free Trial (Days)
              </label>
              <input
                type="number"
                name="defaultFreeTrialDays"
                value={formData.defaultFreeTrialDays}
                onChange={handleNumberChange}
                min={0}
                max={90}
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Granted to new accounts upon signup</span>
            </div>

            {/* Free Monthly Bill Limit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Free Plan Monthly Bills
              </label>
              <input
                type="number"
                name="freePlanMonthlyBillLimit"
                value={formData.freePlanMonthlyBillLimit}
                onChange={handleNumberChange}
                min={0}
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Maximum bills allowed per month on Free tier</span>
            </div>

            {/* Free Customer Limit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Free Plan Customer Quota
              </label>
              <input
                type="number"
                name="freePlanCustomerLimit"
                value={formData.freePlanCustomerLimit}
                onChange={handleNumberChange}
                min={0}
                className="w-full h-10 px-3.5 text-sm bg-gray-50/70 border border-gray-200 rounded-lg focus:outline-none focus:border-[#093C5D] focus:bg-white transition-all text-gray-900 font-medium"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Maximum customer profiles on Free tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <SettingSaveButton
        isUpdating={isUpdating}
        label="Save Operations Config"
        loadingLabel="Updating Switches..."
      />
    </form>
  );
};

export default PlatformOperationsSettings;
