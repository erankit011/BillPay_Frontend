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
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">{t('Settings')}</h1>
          <p className="text-xs md:text-sm font-medium text-gray-600 mt-1 md:mt-1.5">{t('Manage your shop preferences and profile')}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit} className="p-5 md:p-6 lg:p-8 space-y-6 md:space-y-8">
            
            {/* Profile Section */}
            <section>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 md:mb-6">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{t('Profile Information')}</h2>
                <Link 
                  to="/profile" 
                  className="cursor-pointer text-xs md:text-sm text-[#093C5D] hover:text-[#093C5D] font-semibold flex items-center gap-1 transition-colors active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#093C5D] rounded-xl px-2 py-1"
                >
                  {t('Edit Profile')} →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Shop Name')}</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 bg-white text-gray-900 text-xs md:text-sm font-medium cursor-not-allowed" 
                    value={user?.shopName || ''} 
                    readOnly 
                  />
                  <p className="mt-1.5 text-xs md:text-sm text-[#093C5D] font-semibold">{t('* Edit in Profile')}</p>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Phone Number')}</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 bg-white text-gray-900 text-xs md:text-sm font-medium cursor-not-allowed" 
                    value={user?.phone || ''} 
                    readOnly 
                  />
                  <p className="mt-1.5 text-xs md:text-sm text-red-600 font-semibold">{t('* Cannot be changed')}</p>
                </div>
              </div>
            </section>

            {/* Billing Preferences */}
            <section>
              <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-5 md:mb-6">{t('Billing Preferences')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Invoice Prefix')}</label>
                  <input 
                    type="text" 
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Currency Symbol')}</label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="cursor-pointer w-full rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 appearance-none bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="INR">₹ (INR)</option>
                    <option value="USD">$ (USD)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* WhatsApp Settings */}
            <section>
              <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-5 md:mb-6">{t('WhatsApp Automation')}</h2>
              <div className="space-y-4 md:space-y-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="autoSendInvoices"
                    checked={formData.autoSendInvoices}
                    onChange={handleChange}
                    className="cursor-pointer w-5 h-5 text-[#093C5D] rounded border-gray-300 focus:ring-1 focus:ring-[#093C5D] mt-0.5 flex-shrink-0" 
                  />
                  <span className="text-gray-900 font-medium text-xs md:text-sm group-hover:text-gray-700 transition-colors">{t('Auto-send invoices on bill creation')}</span>
                </label>
                
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      name="autoSendReminders"
                      checked={formData.autoSendReminders}
                      onChange={handleChange}
                      className="cursor-pointer w-5 h-5 text-[#093C5D] rounded border-gray-300 focus:ring-1 focus:ring-[#093C5D] mt-0.5 flex-shrink-0" 
                    />
                    <span className="text-gray-900 font-medium text-xs md:text-sm group-hover:text-gray-700 transition-colors">{t('Auto-send payment reminders')}</span>
                  </label>
                  
                  {formData.autoSendReminders && (
                    <div className="ml-8 mt-4">
                      <label className="block text-xs md:text-sm font-semibold text-gray-800 mb-2">{t('Send reminder before (days)')}</label>
                      <input 
                        type="number" 
                        name="reminderDays"
                        value={formData.reminderDays}
                        onChange={handleChange}
                        className="w-full md:w-48 rounded-xl border border-gray-300 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200" 
                        min="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="pt-4 md:pt-6 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center font-semibold text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all duration-200 w-full md:w-auto justify-center focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:ring-offset-2"
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
