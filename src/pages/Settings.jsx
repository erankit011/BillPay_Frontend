import React from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('Settings')}</h1>
        <p className="text-gray-500 text-sm">{t('Manage your shop preferences and profile')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Profile Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t('Profile Information')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('Shop Name')}</label>
                <input type="text" className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500" defaultValue="My Kirana Store" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('Phone Number')}</label>
                <input type="text" className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50" defaultValue="9876543210" disabled />
              </div>
            </div>
          </section>

          {/* Billing Preferences */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t('Billing Preferences')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('Invoice Prefix')}</label>
                <input type="text" className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500" defaultValue="INV" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('Currency Symbol')}</label>
                <select className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="INR">₹ (INR)</option>
                  <option value="USD">$ (USD)</option>
                </select>
              </div>
            </div>
          </section>

          {/* WhatsApp Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t('WhatsApp Automation')}</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" defaultChecked />
                <span className="text-gray-700 font-medium">{t('Auto-send invoices on bill creation')}</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" defaultChecked />
                <span className="text-gray-700 font-medium">{t('Auto-send payment reminders')}</span>
              </label>
              <div className="pl-8 pt-2">
                <label className="block text-sm font-medium text-gray-700">{t('Send reminder before (days)')}</label>
                <input type="number" className="mt-1 block w-32 rounded-xl border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500" defaultValue="3" />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-sm font-medium">
              <Save className="w-5 h-5 mr-2" />
              {t('Save Changes')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
