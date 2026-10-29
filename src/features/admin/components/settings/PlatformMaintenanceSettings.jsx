/**
 * Platform Scheduled Maintenance Settings
 * Toggles system lockdown mode and broadcasts customizable maintenance notices to merchants in real time.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, AlertTriangle, ShieldCheck } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import SettingSaveButton from './SettingSaveButton';

/**
 * PlatformMaintenanceSettings Component
 */
const PlatformMaintenanceSettings = ({ settings, onUpdate, isUpdating }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: '',
  });

  const [initialData, setInitialData] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: '',
  });

  useEffect(() => {
    if (settings) {
      const data = {
        isMaintenanceMode: Boolean(settings.isMaintenanceMode),
        maintenanceMessage:
          settings.maintenanceMessage ||
          'Platform is currently undergoing scheduled system maintenance. Please check back shortly.',
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

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, t('Platform maintenance mode settings updated successfully'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/**
       * Maintenance Mode Card Section
       * Global operational kill-switch and public notice banner configuration.
       */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              formData.isMaintenanceMode
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[#093C5D]/10 text-[#093C5D] border-[#093C5D]/20'
            }`}>
              {formData.isMaintenanceMode ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Wrench className="w-5 h-5 text-[#093C5D]" />
              )}
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Platform Maintenance Mode')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('Control system maintenance and merchant lockdown notice')}</p>
            </div>
          </div>

          <span className={`text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded border whitespace-nowrap ${
            formData.isMaintenanceMode
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {formData.isMaintenanceMode ? t('Maintenance Active') : t('System Operational')}
          </span>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 space-y-4">
          <ToggleSwitch
            name="isMaintenanceMode"
            checked={formData.isMaintenanceMode}
            onChange={handleChange}
            label={t('Enable Maintenance Mode')}
            description={t('Display maintenance banner and restrict merchant operations during software updates')}
          />

          {formData.isMaintenanceMode && (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Public Maintenance Notice Message')}
                </label>
                <textarea
                  name="maintenanceMessage"
                  rows={3}
                  value={formData.maintenanceMessage}
                  onChange={handleChange}
                  placeholder={t('Platform is currently undergoing scheduled system maintenance. Please check back shortly.')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] resize-none"
                />
                <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">
                  {t('This message will be shown prominently to all storekeepers and visitors')}
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {t('When maintenance mode is active, storekeepers will receive a warning banner informing them of ongoing system work.')}
                </span>
              </div>
            </div>
          )}

          {!formData.isMaintenanceMode && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {t('System is running normally. All merchant services, billing APIs, and customer ledgers are active.')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/**
       * Save Maintenance Settings Button Bar
       * Commits maintenance flag and alert messaging to platform configuration.
       */}
      <SettingSaveButton
        isUpdating={isUpdating}
        hasChanges={hasChanges}
        label="Save Maintenance Settings"
        loadingLabel="Saving Changes..."
      />
    </form>
  );
};

export default PlatformMaintenanceSettings;
