import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToggleSwitch from './ToggleSwitch';
import SettingSaveButton from './SettingSaveButton';

const PlatformNotificationSettings = ({ settings, onUpdate, isUpdating }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    alertOnNewMerchantSignup: true,
    alertOnSubscriptionPayment: true,
    enableEmailNotifications: true,
    enableWhatsAppAlerts: true,
  });

  const [initialData, setInitialData] = useState({
    alertOnNewMerchantSignup: true,
    alertOnSubscriptionPayment: true,
    enableEmailNotifications: true,
    enableWhatsAppAlerts: true,
  });

  useEffect(() => {
    if (settings) {
      const data = {
        alertOnNewMerchantSignup: settings.alertOnNewMerchantSignup !== false,
        alertOnSubscriptionPayment: settings.alertOnSubscriptionPayment !== false,
        enableEmailNotifications: settings.enableEmailNotifications !== false,
        enableWhatsAppAlerts: settings.enableWhatsAppAlerts !== false,
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, t('Admin notification preferences updated successfully'));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
      {/* ── Admin Alert Preferences Card ── */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-none">
        <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Notifications & Alerts')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('Control automated messages and administrative alerts')}</p>
        </div>

        <div className="px-4 sm:px-5 md:px-6 py-2 sm:py-3 space-y-0">
          <ToggleSwitch
            name="alertOnNewMerchantSignup"
            checked={formData.alertOnNewMerchantSignup}
            onChange={handleChange}
            label={t('New Store Registrations Alert')}
            description={t('Receive an instant administrative alert when a new store signs up')}
          />
          <ToggleSwitch
            name="alertOnSubscriptionPayment"
            checked={formData.alertOnSubscriptionPayment}
            onChange={handleChange}
            label={t('Subscription Purchases & Upgrades')}
            description={t('Get notified when a store purchases or renews a Pro subscription')}
          />
          <ToggleSwitch
            name="enableEmailNotifications"
            checked={formData.enableEmailNotifications}
            onChange={handleChange}
            label={t('Administrative Email Dispatch')}
            description={t('Deliver critical platform security and system notices to the official support email')}
          />
          <ToggleSwitch
            name="enableWhatsAppAlerts"
            checked={formData.enableWhatsAppAlerts}
            onChange={handleChange}
            label={t('WhatsApp Alerts & Delivery Status')}
            description={t('Enable WhatsApp gateway dispatch for platform alerts and payment receipts')}
          />
        </div>
      </section>

      {/* Floating Sticky Save Button Bar */}
      <SettingSaveButton
        isUpdating={isUpdating}
        hasChanges={hasChanges}
        label="Save Notification Preferences"
        loadingLabel="Saving Preferences..."
      />
    </form>
  );
};

export default PlatformNotificationSettings;
