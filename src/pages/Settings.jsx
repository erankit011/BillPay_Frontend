import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Settings')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your shop preferences and profile')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 lg:p-8 space-y-8 md:space-y-10">

          {/* Profile Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">{t('Profile Information')}</h2>
              <Link
                to="/profile"
                className="cursor-pointer text-xs md:text-sm text-[#093C5D] hover:text-[#082a42] font-semibold flex items-center gap-1 transition-colors rounded-lg px-2 py-1"
              >
                {t('Edit Profile')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">{t('Shop Name')}</label>
                <input
                  type="text"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                  value={user?.shopName || ''}
                  readOnly
                />
                <p className="text-[#093C5D] text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Edit in Profile')}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">{t('Phone Number')}</label>
                <input
                  type="text"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                  value={user?.phone || ''}
                  readOnly
                />
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Cannot be changed')}</p>
              </div>
            </div>
          </section>

          {/* Billing Preferences */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-5">{t('Billing Preferences')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">{t('Invoice Prefix')}</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">{t('Currency Symbol')}</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] appearance-none bg-white cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="INR">{t("₹ (INR)")}</option>
                  <option value="USD">{t("$ (USD)")}</option>
                </select>
              </div>
            </div>
          </section>

          {/* WhatsApp Settings */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-5">{t('WhatsApp Automation')}</h2>
            <div className="space-y-4 md:space-y-5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="autoSendInvoices"
                  checked={formData.autoSendInvoices}
                  onChange={handleChange}
                  className="cursor-pointer w-4 h-4 text-[#093C5D] rounded border-gray-300 focus:ring-[#093C5D] mt-0.5 shrink-0 transition-colors"
                />
                <span className="text-gray-900 font-medium text-sm transition-colors">{t('Auto-send invoices on bill creation')}</span>
              </label>

              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="autoSendReminders"
                    checked={formData.autoSendReminders}
                    onChange={handleChange}
                    className="cursor-pointer w-4 h-4 text-[#093C5D] rounded border-gray-300 focus:ring-[#093C5D] mt-0.5 shrink-0 transition-colors"
                  />
                  <span className="text-gray-900 font-medium text-sm transition-colors">{t('Auto-send payment reminders')}</span>
                </label>

                {formData.autoSendReminders && (
                  <div className="ml-7 mt-4">
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">{t('Send reminder before (days)')}</label>
                    <input
                      type="number"
                      name="reminderDays"
                      value={formData.reminderDays}
                      onChange={handleChange}
                      className="block w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      min="1"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-2 md:pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 justify-center font-semibold text-xs md:text-sm w-full sm:w-auto active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>{loading ? t('Saving...') : t('Save Changes')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
