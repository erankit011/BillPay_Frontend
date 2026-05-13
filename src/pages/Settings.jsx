import React, { useState, useEffect } from 'react';
import { Save, User, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    invoicePrefix: 'INV',
    currency: 'INR',
    autoSendInvoices: true,
    autoSendReminders: true,
    reminderDays: 3,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.data) {
          const settings = res.data.data;
          setFormData({
            invoicePrefix: settings.invoicePrefix || 'INV',
            currency: settings.currency || 'INR',
            autoSendInvoices: settings.autoSendInvoices !== undefined ? settings.autoSendInvoices : true,
            autoSendReminders: settings.autoSendReminders !== undefined ? settings.autoSendReminders : true,
            reminderDays: settings.reminderDays || 3,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/settings', formData);
      if (res.data.success) {
        alert(t('Settings updated successfully'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('Failed to update settings'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('Settings')}</h1>
        <p className="text-gray-500 text-sm">{t('Manage your shop preferences and profile')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Profile Section */}
          <section>
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('Profile Information')}</h2>
              <Link to="/profile" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
                {t('Edit Profile')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-75">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Shop Name')}</label>
                <input type="text" className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" value={user?.shopName || ''} readOnly disabled />
                <p className="mt-1.5 text-xs text-indigo-500 font-medium">{t('* Edit in Profile')}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Phone Number')}</label>
                <input type="text" className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" value={user?.phone || ''} readOnly disabled />
                <p className="mt-1.5 text-xs text-red-400 font-medium">{t('* Cannot be changed')}</p>
              </div>
            </div>
          </section>

          {/* Billing Preferences */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t('Billing Preferences')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Invoice Prefix')}</label>
                <input 
                  type="text" 
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Currency Symbol')}</label>
                <select 
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                >
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
                <input 
                  type="checkbox" 
                  name="autoSendInvoices"
                  checked={formData.autoSendInvoices}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                />
                <span className="text-gray-700 font-medium">{t('Auto-send invoices on bill creation')}</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="autoSendReminders"
                  checked={formData.autoSendReminders}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" 
                />
                <span className="text-gray-700 font-medium">{t('Auto-send payment reminders')}</span>
              </label>
              <div className="pl-8 pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Send reminder before (days)')}</label>
                <input 
                  type="number" 
                  name="reminderDays"
                  value={formData.reminderDays}
                  onChange={handleChange}
                  className="mt-1 block w-32 rounded-xl border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  min="1"
                />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-sm font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? t('Saving...') : t('Save Changes')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
