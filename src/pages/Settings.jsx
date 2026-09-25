import { useState, useEffect } from 'react';
import { Save, Store, FileText, Bell, ShoppingCart, CreditCard, ChevronRight, BriefcaseBusiness, Lock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { logout } from '../redux/slices/authSlice';
import SwirlingLoader from '../components/common/SwirlingLoader';


// ── Section Nav Item ──
const SectionNavItem = ({ icon: Icon, label, sectionId, activeSection, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(sectionId)}
    className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 text-left ${activeSection === sectionId
        ? 'bg-[#093C5D]/5 text-[#093C5D] border border-[#093C5D]/15'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
      }`}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span className="truncate">{label}</span>
    <ChevronRight className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${activeSection === sectionId ? 'rotate-90' : ''}`} />
  </button>
);

// ── Toggle Switch Component ──
const ToggleSwitch = ({ name, checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      className={`cursor-pointer relative inline-flex items-center shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#093C5D]' : 'bg-gray-300'
        }`}
      style={{ width: '36px', height: '20px', minWidth: '36px', minHeight: '20px', padding: 0 }}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
      />
    </div>
  </div>
);

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeSection, setActiveSection] = useState('business');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const dispatch = useDispatch();
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    confirmationText: ''
  });
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const defaultSettings = {
    // Billing & Invoice
    invoicePrefix: 'INV',
    currency: 'INR',
    taxEnabled: false,
    taxRate: 0,
    defaultPaymentMode: 'CASH',
    defaultPaymentTerms: 30,
    // Shop / Business Info
    gstNumber: '',
    shopAddress: '',
    upiId: '',
    shopPhone: '',
    shopEmail: '',
    // Notifications & Automation
    autoSendWhatsapp: true,
    autoSendInvoices: true,
    autoSendReminders: true,
    reminderDays: 3,
    emailNotifications: true,
    // Inventory
    lowStockThreshold: 5,
    lowStockAlert: true,
    // Invoice Footer / Notes
    invoiceFooterNote: '',
    termsAndConditions: '',
  };

  const [formData, setFormData] = useState(defaultSettings);
  const [initialData, setInitialData] = useState(defaultSettings);
  const [userHasPassword, setUserHasPassword] = useState(true); // Default to true

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, authRes] = await Promise.all([
          api.get('/settings'),
          api.get('/auth/me').catch(() => null)
        ]);

        if (authRes?.data?.success) {
          setUserHasPassword(authRes.data.data.hasPassword);
        }

        if (settingsRes.data.success && settingsRes.data.data) {
          const s = settingsRes.data.data;
          const fetchedSettings = {
            invoicePrefix: s.invoicePrefix || 'INV',
            currency: s.currency || 'INR',
            taxEnabled: s.taxEnabled ?? false,
            taxRate: s.taxRate ?? 0,
            defaultPaymentMode: s.defaultPaymentMode || 'CASH',
            defaultPaymentTerms: s.defaultPaymentTerms ?? 30,
            gstNumber: s.gstNumber || '',
            shopAddress: s.shopAddress || '',
            upiId: s.upiId || '',
            shopPhone: s.shopPhone || '',
            shopEmail: s.shopEmail || '',
            autoSendWhatsapp: s.autoSendWhatsapp ?? true,
            autoSendInvoices: s.autoSendInvoices ?? true,
            autoSendReminders: s.autoSendReminders ?? true,
            reminderDays: s.reminderDays ?? 3,
            emailNotifications: s.emailNotifications ?? true,
            lowStockThreshold: s.lowStockThreshold ?? 5,
            lowStockAlert: s.lowStockAlert ?? true,
            invoiceFooterNote: s.invoiceFooterNote || '',
            termsAndConditions: s.termsAndConditions || '',
          };
          setFormData(fetchedSettings);
          setInitialData(fetchedSettings);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
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
        setInitialData(formData); // Update initial data after successful save
        alert(t('Settings updated successfully'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('Failed to update settings'));
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t('New password and confirm password do not match!'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert(t('Password must be at least 6 characters long!'));
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        alert(t('Password updated successfully!'));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert(error.response?.data?.message || t('Failed to update password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountChange = (e) => {
    const { name, value } = e.target;
    setDeleteAccountData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteAccountSubmit = () => {
    // Basic validation
    if (userHasPassword && !deleteAccountData.password) {
      alert(t('Please enter your password to delete the account.'));
      return;
    }
    const REQUIRED_TEXT = 'DELETE MY ACCOUNT';
    if (!userHasPassword && deleteAccountData.confirmationText !== REQUIRED_TEXT) {
      alert(t(`Please type ${REQUIRED_TEXT} to confirm.`));
      return;
    }

    setDeleteModalOpen(true);
  };

  const executeDeleteAccount = async () => {
    try {
      setDeleteAccountLoading(true);
      const res = await api.delete('/auth/delete-account', {
        data: {
          password: deleteAccountData.password,
          confirmationText: deleteAccountData.confirmationText
        }
      });

      if (res.data.success) {
        setDeleteModalOpen(false);
        alert(t('Account deleted successfully.'));
        dispatch(logout());
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      alert(error.response?.data?.message || t('Failed to delete account.'));
      setDeleteModalOpen(false);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <SwirlingLoader />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 pb-24 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Settings')}</h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
          {t('Manage your shop preferences and profile')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ── Left Nav (Desktop) ── */}
        <div className="hidden lg:block w-56 xl:w-60 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <SectionNavItem icon={BriefcaseBusiness} label={t('Business Info')} sectionId="business" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={CreditCard} label={t('Billing & Invoice')} sectionId="billing" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={Bell} label={t('Notifications')} sectionId="notifications" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={ShoppingCart} label={t('Product')} sectionId="product" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={FileText} label={t('Invoice Notes')} sectionId="notes" activeSection={activeSection} onClick={scrollToSection} />
            {userHasPassword && <SectionNavItem icon={Lock} label={t('Change Password')} sectionId="security" activeSection={activeSection} onClick={scrollToSection} />}
            <SectionNavItem icon={Trash2} label={t('Delete Account')} sectionId="account" activeSection={activeSection} onClick={scrollToSection} />
          </nav>
        </div>

        {/* ── Mobile Nav (Horizontal Scroll) ── */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {[
            { id: 'business', icon: BriefcaseBusiness, label: t('Business Info') },
            { id: 'billing', icon: CreditCard, label: t('Billing & Invoice') },
            { id: 'notifications', icon: Bell, label: t('Notifications') },
            { id: 'product', icon: ShoppingCart, label: t('Product') },
            { id: 'notes', icon: FileText, label: t('Invoice Notes') },
            { id: 'security', icon: Lock, label: t('Password') },
            { id: 'account', icon: Trash2, label: t('Delete Account') },
          ].filter(item => userHasPassword || item.id !== 'security').map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              onClick={() => scrollToSection(id)}
              className={`cursor-pointer flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${activeSection === id
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15'
                  : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {label}
            </div>
          ))}
        </div>

        {/* ── Right Content ── */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">


            {/* ═══════════════ BUSINESS INFO ═══════════════ */}
            {activeSection === 'business' && (
              <section id="section-business" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Business Information')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Details shown on your invoices and receipts')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('GST Number')}</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="23ABCDE0000A1A2"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('UPI Id')}</label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="yourshop@upi"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                    </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Business Phone')}</label>
                    <input
                      type="text"
                      name="shopPhone"
                      value={formData.shopPhone}
                      onChange={handleChange}
                      placeholder="+91 98005 00012"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Shown on invoices, can differ from personal phone')}</p>
                  </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Business Email')}</label>
                    <input
                      type="email"
                      name="shopEmail"
                      value={formData.shopEmail}
                      onChange={handleChange}
                      placeholder="yourshop@gmail.com"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Shown on invoices, can differ from personal email')}</p>
                  </div>
                    <div className="md:col-span-2">
                      <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Shop Address')}</label>
                    <textarea
                      name="shopAddress"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      placeholder={t('123, MG Road, Near City Mall, Indore, Madhya Pradesh - 110010')}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] resize-none"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('This address will appear on all invoices')}</p>
                  </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ BILLING & INVOICE ═══════════════ */}
            {activeSection === 'billing' && (
              <section id="section-billing" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Billing & Invoice')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Configure how your invoices are generated')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Invoice Prefix')}</label>
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix}
                      onChange={handleChange}
                      placeholder="INV"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Used before invoice number, e.g. INV-001')}</p>
                  </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Currency')}</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      
                      <option value="INR">{t('₹ (INR)')}</option>
                      <option value="USD">{t('$ (USD)')}</option>
                    
                    </select>
                  </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Default Payment Mode')}</label>
                    <select
                      name="defaultPaymentMode"
                      value={formData.defaultPaymentMode}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      
                      <option value="CASH">{t('Cash')}</option>
                      <option value="UPI">{t('UPI')}</option>
                      <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
                      <option value="CHEQUE">{t('Cheque')}</option>
                      <option value="CREDIT">{t('Credit')}</option>
                    
                    </select>
                  </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Payment Terms (Days)')}</label>
                      <input
                        type="number"
                        name="defaultPaymentTerms"
                        value={formData.defaultPaymentTerms}
                        onChange={handleChange}
                        min="0"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                      <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Default due period for invoices')}</p>
                    </div>
                  </div>

                  {/* Tax Settings */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <ToggleSwitch
                      name="taxEnabled"
                      checked={formData.taxEnabled}
                      onChange={handleChange}
                      label={t('Enable Tax / GST')}
                      description={t('Add tax to invoices automatically')}
                    />
                    {formData.taxEnabled && (
                      <div className="mt-4 ml-0 md:ml-0">
                        <div>
                          <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Tax Rate (%)')}</label>
                          <input
                            type="number"
                            name="taxRate"
                            value={formData.taxRate}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.1"
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                          />
                          <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Applied to all new invoices')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ NOTIFICATIONS & AUTOMATION ═══════════════ */}
            {activeSection === 'notifications' && (
              <section id="section-notifications" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Notifications & Automation')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Control automatic messages and alerts')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6 space-y-0">
                  <ToggleSwitch
                    name="autoSendWhatsapp"
                    checked={formData.autoSendWhatsapp}
                    onChange={handleChange}
                    label={t('WhatsApp Notifications')}
                    description={t('Send updates via WhatsApp')}
                  />
                  <ToggleSwitch
                    name="autoSendInvoices"
                    checked={formData.autoSendInvoices}
                    onChange={handleChange}
                    label={t('Auto-send Invoices')}
                    description={t('Send invoice when a bill is created')}
                  />
                  <ToggleSwitch
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    label={t('Email Notifications')}
                    description={t('Receive email alerts for payments & reminders')}
                  />
                  <ToggleSwitch
                    name="autoSendReminders"
                    checked={formData.autoSendReminders}
                    onChange={handleChange}
                    label={t('Auto Payment Reminders')}
                    description={t('Automatically send reminders for pending payments')}
                  />
                  {formData.autoSendReminders && (
                    <div className="pt-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Remind Before (Days)')}</label>
                        <input
                          type="number"
                          name="reminderDays"
                          value={formData.reminderDays}
                          onChange={handleChange}
                          min="1"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        />
                        <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Days before due date to send reminder')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════ PRODUCTS ═══════════════ */}
            {activeSection === 'product' && (
              <section id="section-product" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Product Settings')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Configure stock management alerts')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <ToggleSwitch
                    name="lowStockAlert"
                    checked={formData.lowStockAlert}
                    onChange={handleChange}
                    label={t('Low Stock Alerts')}
                    description={t('Get notified when products are running low')}
                  />
                  {formData.lowStockAlert && (
                    <div className="pt-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Low Stock Threshold')}</label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={formData.lowStockThreshold}
                          onChange={handleChange}
                          min="1"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        />
                        <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Products below this quantity will be flagged')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════ INVOICE NOTES ═══════════════ */}
            {activeSection === 'notes' && (
              <section id="section-notes" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Invoice Notes')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Custom text printed on your invoices')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6 space-y-5">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Invoice Footer Note')}</label>
                    <textarea
                      name="invoiceFooterNote"
                      value={formData.invoiceFooterNote}
                      onChange={handleChange}
                      placeholder={t('Thank you for your business!')}
                      maxLength={500}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] resize-none"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Max 500 characters')}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Terms & Conditions')}</label>
                    <textarea
                      name="termsAndConditions"
                      value={formData.termsAndConditions}
                      onChange={handleChange}
                      placeholder={t('Goods once sold will not be returned')}
                      maxLength={1000}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] resize-none"
                    />
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Max 1000 characters')}</p>
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ SECURITY / PASSWORD ═══════════════ */}
            {activeSection === 'security' && userHasPassword && (
              <section id="section-security" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Change Password')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Update your account password for security')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <div className="space-y-5 max-w-md">
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Current Password')}</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder={t('Enter current password')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('New Password')}</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder={t('Enter new password')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                    <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Confirm New Password')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder={t('Confirm new password')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${(passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'}`}
                      >
                        <Lock className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{passwordLoading ? t('Updating...') : t('Update Password')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ DELETE ACCOUNT ═══════════════ */}
            {activeSection === 'account' && (
              <section id="section-account" className="bg-white rounded-lg border border-red-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-red-100 bg-red-50/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h2 className="text-base md:text-lg font-semibold text-red-700">{t('Delete Account')}</h2>
                  </div>
                  <p className="text-xs text-red-600/80 mt-1">{t('Warning: Deleting your account is permanent and cannot be undone.')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <div className="max-w-md space-y-4">
                    {userHasPassword ? (
                      <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Enter your password to confirm')}</label>
                    <input
                      type="password"
                      name="password"
                      value={deleteAccountData.password}
                      onChange={handleDeleteAccountChange}
                      placeholder={t('Current password')}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    />
                  </div>
                    ) : (
                      <div>
                        <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5"><>{t('Type')} <span className="font-semibold text-gray-900">DELETE MY ACCOUNT</span> {t('to confirm')}</></label>
                        <input
                          type="text"
                          name="confirmationText"
                          value={deleteAccountData.confirmationText}
                          onChange={handleDeleteAccountChange}
                          placeholder="DELETE MY ACCOUNT"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                        />
                        <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium"><>{t('Since you logged in with Google, please type')} <span className="font-semibold text-gray-900">DELETE MY ACCOUNT</span> {t('to confirm.')}</></p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccountSubmit}
                        disabled={deleteAccountLoading || (userHasPassword ? !deleteAccountData.password : deleteAccountData.confirmationText !== 'DELETE MY ACCOUNT')}
                        className={`cursor-pointer bg-red-600 text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${deleteAccountLoading || (userHasPassword ? !deleteAccountData.password : deleteAccountData.confirmationText !== 'DELETE MY ACCOUNT') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{deleteAccountLoading ? t('Deleting...') : t('Delete Account')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ SAVE BUTTON ═══════════════ */}
            {activeSection !== 'security' && activeSection !== 'account' && (
              <div className="sticky bottom-16 lg:bottom-4 z-20 mt-8 pt-4 pb-4 lg:pb-0">
                <div className="bg-white border border-gray-200 p-2 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full">
                  <div className="hidden sm:flex items-center gap-2 text-sm ml-1">
                    <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className={hasChanges ? 'text-amber-700 font-medium' : 'text-gray-500 font-medium'}>
                      {hasChanges ? t('You have unsaved changes') : t('All changes saved')}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !hasChanges}
                    className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${(!hasChanges || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'}`}
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span className="tracking-wide">{loading ? t('Saving...') : t('Save Settings')}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setDeleteModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Delete Account')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you absolutely sure you want to delete your account?')} {t('This action cannot be undone.')}
                </p>

                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={executeDeleteAccount}
                    disabled={deleteAccountLoading}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {deleteAccountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Yes, Delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
