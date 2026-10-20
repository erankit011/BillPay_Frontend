import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, CreditCard, UserPlus } from 'lucide-react';
import SettingCardHeader from './SettingCardHeader';
import SettingSaveButton from './SettingSaveButton';

const PlatformNotificationSettings = ({ settings, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState({
    alertOnNewMerchantSignup: true,
    alertOnSubscriptionPayment: true,
    enableEmailNotifications: true,
    enableWhatsAppAlerts: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        alertOnNewMerchantSignup: settings.alertOnNewMerchantSignup !== false,
        alertOnSubscriptionPayment: settings.alertOnSubscriptionPayment !== false,
        enableEmailNotifications: settings.enableEmailNotifications !== false,
        enableWhatsAppAlerts: settings.enableWhatsAppAlerts !== false,
      });
    }
  }, [settings]);

  const handleToggle = (key) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, 'Admin notification preferences updated successfully');
  };

  const notificationOptions = [
    {
      key: 'alertOnNewMerchantSignup',
      title: 'New Store Registrations Alert',
      desc: 'Send an immediate administrative alert when a new storekeeper signs up and verifies their account.',
      icon: UserPlus,
      color: 'text-[#093C5D]',
      bg: 'bg-blue-50',
    },
    {
      key: 'alertOnSubscriptionPayment',
      title: 'SaaS Subscription Purchases & Renewals',
      desc: 'Receive alerts whenever a merchant upgrades to Monthly, Quarterly, or Yearly Pro plans.',
      icon: CreditCard,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      key: 'enableEmailNotifications',
      title: 'Administrative Email Dispatch',
      desc: 'Deliver high-priority administrative security and platform notices to the official support mailbox.',
      icon: Mail,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    {
      key: 'enableWhatsAppAlerts',
      title: 'WhatsApp Gateway Integration Status',
      desc: 'Enable automated platform delivery status for billing reminders and payment receipts.',
      icon: MessageSquare,
      color: 'text-green-700',
      bg: 'bg-green-50',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6 shadow-none">
        <SettingCardHeader
          icon={Bell}
          title="Platform Alert Channels & Triggers"
          subtitle="Customize automated administrative notifications and dispatches"
          iconBg="bg-[#093C5D]/10"
          iconColor="text-[#093C5D]"
        />

        <div className="space-y-3.5">
          {notificationOptions.map((item) => {
            const Icon = item.icon;
            const checked = formData[item.key];
            return (
              <div
                key={item.key}
                className="flex items-start justify-between p-3.5 sm:p-4 rounded-lg bg-gray-50/70 border border-gray-200/80 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 block">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500 font-medium mt-0.5 block leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4 mt-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#093C5D]"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <SettingSaveButton
        isUpdating={isUpdating}
        label="Save Alert Preferences"
        loadingLabel="Saving Preferences..."
      />
    </form>
  );
};

export default PlatformNotificationSettings;
