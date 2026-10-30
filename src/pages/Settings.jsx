/**
 * Store Configuration & Merchant Workspace Settings
 * Manages shop profile, invoice headers, UPI IDs, inventory thresholds, active sessions, and data exports.
 */

import { useState, useEffect } from 'react';
import { Save, Store, FileText, Bell, ShoppingCart, CreditCard, ChevronRight, BriefcaseBusiness, Lock, Trash2, AlertTriangle, Loader2, Download, Upload, X, Laptop, Monitor, Smartphone, Tablet, Globe, LogOut, RefreshCw, Gem, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { logout, setUser } from '../redux/slices/authSlice';
import SwirlingLoader from '../components/common/SwirlingLoader';
import toast from 'react-hot-toast';
import { formatShortDate, formatRelativeTime } from '../utils/dateUtils';
import AppVersionCard from '../components/common/AppVersionCard';

/**
 * Settings Navigation Item
 */
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

/**
 * Toggle Switch Component
 * Reusable accessible boolean toggle control with label and description
 */
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
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('udharpay_settings_tab') || 'business';
  });

  useEffect(() => {
    localStorage.setItem('udharpay_settings_tab', activeSection);
  }, [activeSection]);

  /**
   * Password Update State
   * Controls form inputs and network state for credential rotation
   */
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  /**
   * Account Deletion State
   * Holds user verification inputs and loading state for account purging
   */
  const dispatch = useDispatch();
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    confirmationText: ''
  });
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  /**
   * Active Device & Session State
   * Stores authenticated devices, active operations, and targeted logout modals
   */
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceActionLoadingId, setDeviceActionLoadingId] = useState(null);
  const [loggingOutAllOthers, setLoggingOutAllOthers] = useState(false);
  const [deviceToLogout, setDeviceToLogout] = useState(null);
  const [confirmLogoutOthersModal, setConfirmLogoutOthersModal] = useState(false);

  /**
   * Default Store Configuration
   * Initial baseline values for billing, profile, tax rates, inventory, and notes
   */
  const defaultSettings = {
    invoicePrefix: 'INV',
    currency: 'INR',
    taxEnabled: false,
    taxRate: 0,
    defaultPaymentMode: 'CASH',
    defaultPaymentTerms: 30,
    printerType: 'A4',
    autoPrint: false,
    invoiceLogo: '',
    signatureImage: '',
    discountType: 'PERCENTAGE',
    gstSplit: false,
    defaultCreditLimit: 0,
    voiceLanguage: 'hi-IN',
    shopName: '',
    gstNumber: '',
    shopAddress: '',
    upiId: '',
    shopPhone: '',
    shopEmail: '',
    autoSendInvoices: true,
    emailNotifications: true,
    lowStockThreshold: 5,
    lowStockAlert: true,
    invoiceFooterNote: '',
    termsAndConditions: '',
  };

  const [formData, setFormData] = useState(defaultSettings);
  const [initialData, setInitialData] = useState(defaultSettings);

  /**
   * Credential Authentication Flag
   * Indicates whether account was created via password or passwordless OAuth (e.g. Google)
   */
  const [userHasPassword, setUserHasPassword] = useState(true);
  const [platformInvoices, setPlatformInvoices] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    if (!userHasPassword && activeSection === 'security') {
      setActiveSection('business');
    }
  }, [userHasPassword, activeSection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, authRes, invoicesRes] = await Promise.all([
          api.get('/settings'),
          api.get('/auth/me').catch(() => null),
          api.get('/subscription/invoices').catch(() => null)
        ]);

        if (authRes?.data?.success) {
          setUserHasPassword(authRes.data.data.hasPassword);
        }

        if (invoicesRes?.data?.success) {
          setPlatformInvoices(invoicesRes.data.data.invoices || []);
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
            shopName: s.shopName || '',
            gstNumber: s.gstNumber || '',
            shopAddress: s.shopAddress || '',
            upiId: s.upiId || '',
            shopPhone: s.shopPhone || '',
            shopEmail: s.shopEmail || '',
            autoSendInvoices: s.autoSendInvoices ?? true,
            emailNotifications: s.emailNotifications ?? true,
            lowStockThreshold: s.lowStockThreshold ?? 5,
            lowStockAlert: s.lowStockAlert ?? true,
            invoiceFooterNote: s.invoiceFooterNote || '',
            termsAndConditions: s.termsAndConditions || '',
            printerType: s.printerType || 'A4',
            autoPrint: s.autoPrint ?? false,
            invoiceLogo: s.invoiceLogo || '',
            signatureImage: s.signatureImage || '',
            discountType: s.discountType || 'PERCENTAGE',
            gstSplit: s.gstSplit ?? false,
            defaultCreditLimit: s.defaultCreditLimit ?? 0,
            voiceLanguage: s.voiceLanguage || 'hi-IN',
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
    if (!formData.shopName || !formData.shopName.trim()) {
      toast.error(t('Business / Shop Name is required'));
      return;
    }
    if (!formData.signatureImage || !formData.signatureImage.trim()) {
      toast.error(t('Authorized Signature is required'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/settings', formData);
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        const savedSettings = {
          invoicePrefix: s.invoicePrefix || 'INV',
          currency: s.currency || 'INR',
          taxEnabled: s.taxEnabled ?? false,
          taxRate: s.taxRate ?? 0,
          defaultPaymentMode: s.defaultPaymentMode || 'CASH',
          defaultPaymentTerms: s.defaultPaymentTerms ?? 30,
          shopName: s.shopName || '',
          gstNumber: s.gstNumber || '',
          shopAddress: s.shopAddress || '',
          upiId: s.upiId || '',
          shopPhone: s.shopPhone || '',
          shopEmail: s.shopEmail || '',
          autoSendInvoices: s.autoSendInvoices ?? true,
          emailNotifications: s.emailNotifications ?? true,
          lowStockThreshold: s.lowStockThreshold ?? 5,
          lowStockAlert: s.lowStockAlert ?? true,
          invoiceFooterNote: s.invoiceFooterNote || '',
          termsAndConditions: s.termsAndConditions || '',
          printerType: s.printerType || 'A4',
          autoPrint: s.autoPrint ?? false,
          invoiceLogo: s.invoiceLogo || '',
          signatureImage: s.signatureImage || '',
          discountType: s.discountType || 'PERCENTAGE',
          gstSplit: s.gstSplit ?? false,
          defaultCreditLimit: s.defaultCreditLimit ?? 0,
          voiceLanguage: s.voiceLanguage || 'hi-IN',
        };
        setFormData(savedSettings);
        setInitialData(savedSettings);
        toast.success(t('Settings updated successfully'));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('Failed to update settings'));
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
      toast.error(t('New password and confirm password do not match!'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters long!'));
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data.success) {
        toast.success(t('Password updated successfully!'));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || t('Failed to update password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountChange = (e) => {
    const { name, value } = e.target;
    setDeleteAccountData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteAccountSubmit = () => {
    /**
     * Client Validation Guard
     * Validates required password or confirmation passphrase before opening modal
     */
    if (userHasPassword && !deleteAccountData.password) {
      toast.error(t('Please enter your password to delete the account.'));
      return;
    }
    const REQUIRED_TEXT = 'DELETE MY ACCOUNT';
    if (!userHasPassword && deleteAccountData.confirmationText !== REQUIRED_TEXT) {
      toast.error(t(`Please type ${REQUIRED_TEXT} to confirm.`));
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
        toast.success(t('Account deleted successfully.'));
        dispatch(logout());
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error.response?.data?.message || t('Failed to delete account.'));
      setDeleteModalOpen(false);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    /**
     * File Size Guard
     * Restricts logo file size to a maximum of 5MB
     */
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('File is too large. Max 5MB allowed.'));
      return;
    }

    try {
      setUploadingLogo(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.data.url) {
        setFormData(prev => ({ ...prev, invoiceLogo: res.data.data.url }));
        toast.success(t('Logo uploaded successfully. Remember to save settings.'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('Failed to upload logo. Please try again.'));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('File is too large. Max 5MB allowed.'));
      return;
    }

    try {
      setUploadingSignature(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.data.url) {
        setFormData(prev => ({ ...prev, signatureImage: res.data.data.url }));
        toast.success(t('Signature uploaded successfully. Remember to save settings.'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('Failed to upload signature. Please try again.'));
    } finally {
      setUploadingSignature(false);
      e.target.value = '';
    }
  };

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true);
      const res = await api.get('/auth/devices');
      if (res.data?.success) {
        setDevices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load active devices:', err);
      toast.error(t('Failed to load active devices.'));
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'devices') {
      fetchDevices();
    }
  }, [activeSection]);

  const executeLogoutDevice = async (device) => {
    if (!device?._id) return;
    try {
      setDeviceActionLoadingId(device._id);
      const res = await api.delete(`/auth/devices/${device._id}`);
      if (res.data?.success) {
        if (res.data.data?.isCurrentDevice) {
          toast.success(t('Current device logged out. Redirecting...'));
          dispatch(logout());
          window.location.href = '/login';
          return;
        }
        toast.success(t('Device logged out successfully!'));
        setDevices((prev) => prev.filter((d) => d._id !== device._id));
        fetchDevices();
      }
    } catch (err) {
      console.error('Logout device error:', err);
      toast.error(err.response?.data?.message || t('Failed to logout device.'));
    } finally {
      setDeviceActionLoadingId(null);
      setDeviceToLogout(null);
    }
  };

  const executeLogoutAllOthers = async () => {
    try {
      setLoggingOutAllOthers(true);
      const res = await api.delete('/auth/devices/others');
      if (res.data?.success) {
        toast.success(t('All other devices have been logged out.'));
        setDevices((prev) => prev.filter((d) => d.isCurrentDevice));
        fetchDevices();
      }
    } catch (err) {
      console.error('Logout all others error:', err);
      toast.error(err.response?.data?.message || t('Failed to log out other devices.'));
    } finally {
      setLoggingOutAllOthers(false);
      setConfirmLogoutOthersModal(false);
    }
  };

  const formatDeviceTime = (dateStr) => formatRelativeTime(dateStr, t);

  const formatDeviceDate = (dateStr) => formatShortDate(dateStr);

  const getDeviceIcon = (device) => {
    if (!device) return Monitor;
    const type = (device.deviceType || '').toLowerCase();
    const os = (device.os || '').toLowerCase();
    const raw = (device.device || '').toLowerCase();

    if (type === 'mobile' || os.includes('android') || os.includes('ios') || os.includes('iphone')) {
      return Smartphone;
    }
    if (type === 'tablet' || os.includes('ipad') || raw.includes('tablet')) {
      return Tablet;
    }
    if (type === 'desktop' || os.includes('windows') || os.includes('mac') || os.includes('linux')) {
      return Monitor;
    }
    return Laptop;
  };

  const getDeviceTitle = (device) => {
    if (!device) return t('Unknown Device');
    if (device.os && device.os !== 'Unknown OS') {
      if (device.deviceType === 'desktop') return `${device.os} PC`;
      if (device.deviceType === 'mobile') return device.os.includes('Phone') ? device.os : `${device.os} Phone`;
      if (device.deviceType === 'tablet') return `${device.os} Tablet`;
      return device.os;
    }
    const raw = device.device || '';
    if (raw.includes('•')) {
      return raw.split('•')[0].trim();
    }
    return raw || t('Unknown Device');
  };

  const getDeviceSubtitle = (device) => {
    if (!device) return '';
    let browser = device.browser && device.browser !== 'Unknown Browser' ? device.browser : '';
    if (!browser && device.device?.includes('•')) {
      browser = device.device.split('•')[1]?.trim() || '';
    }
    const ip = device.ip && device.ip !== 'Unknown IP' ? `IP: ${device.ip}` : '';
    if (browser && ip) return `${browser} • ${ip}`;
    return browser || ip || '';
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
      {/**
       * Page Header Section
       * Title and descriptive subtitle for shop settings
       */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Settings')}</h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
          {t('Manage your shop preferences and profile')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/**
         * Desktop Sidebar Navigation
         * Vertical navigation menu linking to distinct configuration categories
         */}
        <div className="hidden lg:block w-56 xl:w-60 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <SectionNavItem icon={BriefcaseBusiness} label={t('Business Info')} sectionId="business" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={CreditCard} label={t('Billing & Invoice')} sectionId="billing" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={FileText} label={t('Platform Invoices')} sectionId="platform-invoices" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={Bell} label={t('Notifications')} sectionId="notifications" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={ShoppingCart} label={t('Product')} sectionId="product" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={FileText} label={t('Invoice Notes')} sectionId="notes" activeSection={activeSection} onClick={scrollToSection} />
            {userHasPassword && <SectionNavItem icon={Lock} label={t('Change Password')} sectionId="security" activeSection={activeSection} onClick={scrollToSection} />}
            <SectionNavItem icon={Laptop} label={t('Active Devices')} sectionId="devices" activeSection={activeSection} onClick={scrollToSection} />
            <SectionNavItem icon={Trash2} label={t('Delete Account')} sectionId="account" activeSection={activeSection} onClick={scrollToSection} />

            {/**
             * App Version Metadata Card
             * Desktop sidebar badge displaying release version and build info
             */}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <AppVersionCard variant="sidebar" />
            </div>
          </nav>
        </div>

        {/**
         * Mobile Navigation Bar
         * Horizontally scrollable pill tabs for touch-based category switching
         */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {[
            { id: 'business', icon: BriefcaseBusiness, label: t('Business Info') },
            { id: 'billing', icon: CreditCard, label: t('Billing & Invoice') },
            { id: 'platform-invoices', icon: FileText, label: t('Platform Invoices') },
            { id: 'notifications', icon: Bell, label: t('Notifications') },
            { id: 'product', icon: ShoppingCart, label: t('Product') },
            { id: 'notes', icon: FileText, label: t('Invoice Notes') },
            { id: 'security', icon: Lock, label: t('Password') },
            { id: 'devices', icon: Laptop, label: t('Active Devices') },
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

        {/**
         * Main Settings Workspace
         * Active configuration forms rendered dynamically based on selected navigation category
         */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">


            {/**
             * Business Profile Section
             * Commercial identity details, GSTIN, UPI ID, logo asset, and official address
             */}
            {activeSection === 'business' && (
              <section id="section-business" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Business Information')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Details shown on your invoices and receipts')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Business / Shop Name')} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="Sharma General Store"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                    </div>
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
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Invoice Logo')}</label>
                      
                      <div className="flex flex-col items-start gap-4">
                        {formData.invoiceLogo ? (
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-2 relative group overflow-hidden shadow-none">
                              <img src={formData.invoiceLogo} alt="Logo" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, invoiceLogo: '' }))}
                                className="absolute top-1.5 right-1.5 cursor-pointer bg-[#093C5D] text-white hover:bg-[#072d46] w-6 h-6 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[24px] !min-w-[24px] !p-0 shadow-none z-10"
                                title={t('Remove Logo')}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col items-start justify-center">
                              <span className="text-[13px] sm:text-sm font-semibold text-gray-800">{t('Logo Uploaded')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 w-full space-y-3">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                              <label className={`cursor-pointer w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-xs md:text-sm transition-colors ${uploadingLogo ? 'opacity-50' : 'hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'}`}>
                                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-[#093C5D]" /> : <Upload className="w-4 h-4 text-gray-500" />}
                                <span>{uploadingLogo ? t('Uploading...') : t('Upload New Logo')}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                              </label>
                              
                              <div className="flex-1 w-full flex items-center gap-2">
                                <span className="text-gray-400 font-medium text-xs md:text-sm hidden md:inline-block">{t('Or')}</span>
                                <input
                                  type="url"
                                  name="invoiceLogo"
                                  value={formData.invoiceLogo}
                                  onChange={handleChange}
                                  placeholder={t('Enter image URL (https://...)')}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium text-gray-900 transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                                />
                              </div>
                            </div>
                            <p className="text-gray-500 text-[11px] sm:text-xs font-medium">{t('Upload from your device or paste an image URL. Recommended size: 400x150px. Max 5MB.')}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5">
                        <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                          {t('Authorized Signature')} <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="flex flex-col items-start gap-4">
                          {formData.signatureImage ? (
                            <div className="flex items-center gap-3">
                              <div className="w-28 h-16 sm:w-32 sm:h-20 shrink-0 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-2 relative group overflow-hidden shadow-none">
                                <img src={formData.signatureImage} alt="Signature" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, signatureImage: '' }))}
                                  className="absolute top-1.5 right-1.5 cursor-pointer bg-[#093C5D] text-white hover:bg-[#072d46] w-6 h-6 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[24px] !min-w-[24px] !p-0 shadow-none z-10"
                                  title={t('Remove Signature')}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-col items-start justify-center">
                                <span className="text-[13px] sm:text-sm font-semibold text-gray-800">{t('Signature Uploaded')}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 w-full space-y-3">
                              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                                <label className={`cursor-pointer w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-xs md:text-sm transition-colors ${uploadingSignature ? 'opacity-50' : 'hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'}`}>
                                  {uploadingSignature ? <Loader2 className="w-4 h-4 animate-spin text-[#093C5D]" /> : <Upload className="w-4 h-4 text-gray-500" />}
                                  <span>{uploadingSignature ? t('Uploading...') : t('Upload Signature')}</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                                </label>
                                
                                <div className="flex-1 w-full flex items-center gap-2">
                                  <span className="text-gray-400 font-medium text-xs md:text-sm hidden md:inline-block">{t('Or')}</span>
                                  <input
                                    type="url"
                                    name="signatureImage"
                                    value={formData.signatureImage}
                                    onChange={handleChange}
                                    placeholder={t('Enter signature image URL (https://...)')}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium text-gray-900 transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                                  />
                                </div>
                              </div>
                              <p className="text-gray-500 text-[11px] sm:text-xs font-medium">{t('Upload from your device or paste an image URL. Recommended size: 300x100px. Max 5MB.')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5">
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

            {/**
             * Invoicing & Billing Preferences
             * Serial numbering, currency, payment modes, print formats, and tax rules
             */}
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
                      
                      <option value="INR">{t('₹ INR')}</option>
                      <option value="USD">{t('$ USD')}</option>
                    
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
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Payment Terms in Days')}</label>
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
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Printer Type')}</label>
                      <select
                        name="printerType"
                        value={formData.printerType}
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
                        <option value="A4">{t('A4 Size')}</option>
                        <option value="THERMAL_3INCH">{t('Thermal Printer 3 Inch')}</option>
                        <option value="THERMAL_2INCH">{t('Thermal Printer 2 Inch')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Discount Type')}</label>
                      <select
                        name="discountType"
                        value={formData.discountType}
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
                        <option value="PERCENTAGE">{t('Percentage %')}</option>
                        <option value="FLAT">{t('Rupees ₹')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Default Udhaar Limit')}</label>
                      <input
                        type="number"
                        name="defaultCreditLimit"
                        value={formData.defaultCreditLimit}
                        onChange={handleChange}
                        min="0"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                      />
                      <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('0 means unlimited credit')}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Voice Billing Language')}</label>
                      <select
                        name="voiceLanguage"
                        value={formData.voiceLanguage}
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
                        <option value="hi-IN">{t('Hindi')}</option>
                        <option value="en-US">{t('English')}</option>
                      </select>
                    </div>
                  </div>

                  {/**
                   * Automation Preferences
                   * Automated WhatsApp dispatch and direct print triggers
                   */}
                  <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
                    <ToggleSwitch
                      name="autoSendInvoices"
                      checked={formData.autoSendInvoices}
                      onChange={handleChange}
                      label={t('Auto-Send WhatsApp Invoices')}
                      description={t('Automatically send invoice link to customer on WhatsApp after creating a bill')}
                    />
                    <ToggleSwitch
                      name="autoPrint"
                      checked={formData.autoPrint}
                      onChange={handleChange}
                      label={t('Auto-Print Invoices')}
                      description={t('Automatically print invoice after saving a bill')}
                    />
                  </div>

                  {/**
                   * Tax & GST Calculations
                   * Tax enablement, CGST/SGST split display, and percentage rates
                   */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <ToggleSwitch
                      name="taxEnabled"
                      checked={formData.taxEnabled}
                      onChange={handleChange}
                      label={t('Enable Tax / GST')}
                      description={t('Add tax to invoices automatically')}
                    />
                    {formData.taxEnabled && (
                      <div className="mt-4 ml-0 md:ml-0 space-y-4">
                        <ToggleSwitch
                          name="gstSplit"
                          checked={formData.gstSplit}
                          onChange={handleChange}
                          label={t('Split Tax CGST and SGST')}
                          description={t('Show CGST and SGST separately on invoices')}
                        />
                        <div>
                          <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Tax Rate in %')}</label>
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

            {/**
             * Platform Subscription Billing
             * Subscription history, payment receipts, and plan auto-renewal status
             */}
            {activeSection === 'platform-invoices' && (
              <section id="section-platform-invoices" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Platform Invoices')}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{t('Your UdharPay subscription billing history')}</p>
                  </div>
                </div>

                {/**
                 * Subscription Status Banner
                 * Active tier indicator, renewal dates, and plan management link
                 */}
                <div className="m-4 sm:m-6 bg-gradient-to-r from-[#093C5D]/5 via-white to-blue-50/50 border border-[#093C5D]/15 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center shrink-0 border border-[#093C5D]/15">
                      <Gem className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">{t('Active Membership')}:</span>
                        <strong className="text-sm font-bold text-[#093C5D] uppercase tracking-wide">{user?.subscriptionPlan || 'FREE'}</strong>
                        {user?.subscriptionStatus === 'active' && user?.subscriptionPlan !== 'FREE' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Auto-Pay Active
                          </span>
                        )}
                        {user?.subscriptionStatus === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Auto-Pay Cancelled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {user?.currentPeriodEnd ? `${t('Valid until')} ${formatShortDate(user.currentPeriodEnd)}` : t('7-Day Free Trial')}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/subscription"
                    className="cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#072C44] px-4 py-2.5 rounded-lg transition-colors w-full sm:w-auto shadow-xs active:scale-95"
                  >
                    <span>{t('Manage Plan & Auto-Pay')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="px-0 py-0">
                  {platformInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      {t('No billing history found. Upgrade your plan to see invoices here.')}
                    </div>
                  ) : (
                    <div>
                      {/**
                       * Desktop Invoices Table
                       * Tabular billing history with downloadable platform receipts
                       */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                              <th className="px-6 py-3 font-medium">{t('Date')}</th>
                              <th className="px-6 py-3 font-medium">{t('Transaction ID')}</th>
                              <th className="px-6 py-3 font-medium">{t('Plan')}</th>
                              <th className="px-6 py-3 font-medium">{t('Validity')}</th>
                              <th className="px-6 py-3 font-medium">{t('Amount')}</th>
                              <th className="px-6 py-3 font-medium">{t('Status')}</th>
                              <th className="px-6 py-3 font-medium">{t('Action')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {platformInvoices.map((inv) => (
                              <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatShortDate(inv.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                                  {inv.razorpayPaymentId || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {inv.planName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <span>{formatShortDate(inv.billingPeriodStart)}</span>
                                    <span className="text-gray-400">&rarr;</span>
                                    <span>{formatShortDate(inv.billingPeriodEnd)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  ₹{inv.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    inv.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {inv.receiptUrl ? (
                                    <a 
                                      href={inv.receiptUrl} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[#093C5D] hover:text-[#072d46] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{t('Invoice')}</span>
                                    </a>
                                  ) : (
                                    <Link 
                                      to={`/platform-receipt/${inv._id}`} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[#093C5D] hover:text-[#072d46] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{t('Invoice')}</span>
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/**
                       * Mobile Invoices Card Feed
                       * Responsive cards for reviewing past platform subscription charges
                       */}
                      <div className="block lg:hidden space-y-3 p-1">
                        {platformInvoices.map((inv) => (
                          <div key={`card-${inv._id}`} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 active:bg-gray-50 transition-colors duration-200">
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="min-w-0">
                                <h3 className="text-sm sm:text-[15px] font-semibold text-[#093C5D] truncate leading-tight mb-0.5">{inv.planName} Subscription</h3>
                                <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium font-mono truncate">#{inv.razorpayPaymentId || '-'}</div>
                              </div>
                              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                                inv.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50/50 p-2.5 sm:p-3 rounded-lg border border-gray-100 mb-3">
                              <div>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Date')}</span>
                                <div className="mt-0.5 text-gray-900 font-medium text-xs sm:text-sm">{formatShortDate(inv.createdAt)}</div>
                              </div>
                              <div>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Amount')}</span>
                                <div className="mt-0.5 text-gray-900 font-semibold text-sm sm:text-[15px]">₹{inv.amount}</div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Validity')}</span>
                                <div className="mt-0.5 text-gray-700 font-medium flex items-center gap-1.5 text-xs sm:text-sm">
                                  <span>{formatShortDate(inv.billingPeriodStart)}</span>
                                  <span className="text-gray-400">&rarr;</span>
                                  <span>{formatShortDate(inv.billingPeriodEnd)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end pt-1">
                              {inv.receiptUrl ? (
                                <a 
                                  href={inv.receiptUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 text-[#093C5D] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto border border-[#093C5D]/10 active:scale-95"
                                >
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                  <span>{t('View & Download Invoice')}</span>
                                </a>
                              ) : (
                                <Link 
                                  to={`/platform-receipt/${inv._id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 text-[#093C5D] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto border border-[#093C5D]/10 active:scale-95"
                                >
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                  <span>{t('View & Download Invoice')}</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/**
             * Notifications & Alerts Section
             * Automated customer dispatches and administrative email notifications
             */}
            {activeSection === 'notifications' && (
              <section id="section-notifications" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Notifications & Automation')}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t('Control automatic messages and alerts')}</p>
                </div>
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6 space-y-0">
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

                </div>
              </section>
            )}

            {/**
             * Inventory & Stock Alerts
             * Low stock quantity thresholds and automated merchant notifications
             */}
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

            {/**
             * Invoice Notes & Legal Disclaimers
             * Customizable footer greetings and terms of service printed on merchant bills
             */}
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

            {/**
             * Security & Password Management
             * Password rotation form protected by current credential verification
             */}
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
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${
                          passwordData.currentPassword.length > 0 && passwordData.currentPassword.length < 6
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('New Password')}</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder={t('Enter new password (min 6 characters)')}
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${
                          passwordData.newPassword.length > 0 && (passwordData.newPassword.length < 6 || passwordData.newPassword === passwordData.currentPassword)
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                        }`}
                      />
                      {passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6 && (
                        <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Password must be at least 6 characters')}</p>
                      )}
                      {passwordData.newPassword.length >= 6 && passwordData.newPassword === passwordData.currentPassword && (
                        <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('New password must be different from current password')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('Confirm New Password')}</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder={t('Confirm new password')}
                        className={`block w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:ring-1 focus:outline-none ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : (passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6)
                              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                              : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                        }`}
                      />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Passwords do not match')}</p>
                      )}
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                         <p className="text-green-600 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Passwords match')}</p>
                      )}
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        disabled={
                          passwordLoading || 
                          !passwordData.currentPassword || 
                          passwordData.newPassword.length < 6 || 
                          passwordData.newPassword === passwordData.currentPassword ||
                          !passwordData.confirmPassword || 
                          passwordData.newPassword !== passwordData.confirmPassword
                        }
                        className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${
                          (passwordLoading || !passwordData.currentPassword || passwordData.newPassword.length < 6 || passwordData.newPassword === passwordData.currentPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-[#072d46]'
                        }`}
                      >
                        <Lock className="w-4 h-4 shrink-0" />
                        <span className="tracking-wide">{passwordLoading ? t('Updating...') : t('Update Password')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/**
             * Active Devices & Sessions Section
             * Device fingerprinting, session activity tracking, and remote logout controls
             */}
            {activeSection === 'devices' && (
              <section id="section-devices" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/**
                 * Device Section Header
                 * Section title, description, and global session refresh/terminate controls
                 */}
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-[#093C5D] shrink-0" />
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">{t('Active Devices & Sessions')}</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t('Manage and review devices where your account is currently signed in.')}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={fetchDevices}
                      disabled={devicesLoading}
                      className="cursor-pointer !min-h-0 !min-w-0 h-[30px] sm:h-[34px] px-3.5 sm:px-4 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                      title={t('Refresh devices')}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${devicesLoading ? 'animate-spin text-[#093C5D]' : ''}`} />
                      <span>{t('Refresh')}</span>
                    </button>
                    {devices.filter(d => !d.isCurrentDevice).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmLogoutOthersModal(true)}
                        disabled={loggingOutAllOthers}
                        className="cursor-pointer !min-h-0 !min-w-0 h-[30px] sm:h-[34px] px-3.5 sm:px-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                        title={t('Log Out All Other Devices')}
                      >
                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>{t('Log Out All Other Devices')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/**
                 * Active Sessions List
                 * Rendered device items with platform, IP address, and activity timestamps
                 */}
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
                  {devicesLoading && devices.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-[#093C5D]" />
                      <p className="text-xs font-medium">{t('Loading')}...</p>
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      <Laptop className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium">{t('No active devices found')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {devices.map((device) => {
                        const IconComponent = getDeviceIcon(device);
                        return (
                          <div
                            key={device._id}
                            className={`p-3 sm:p-4 rounded-lg border transition-all ${
                              device.isCurrentDevice
                                ? 'border-[#093C5D]/30 bg-white'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {/**
                             * Device Title Row
                             * Device category icon, operating system title, and logout trigger
                             */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    device.isCurrentDevice
                                      ? 'bg-[#093C5D]/10 text-[#093C5D] border border-[#093C5D]/20'
                                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                                  }`}
                                >
                                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>

                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug whitespace-nowrap truncate" title={getDeviceTitle(device)}>
                                  {getDeviceTitle(device)}
                                </h3>
                              </div>

                              {/**
                               * Remote Logout Action
                               * Revokes authentication token for remote session
                               */}
                              {!device.isCurrentDevice && (
                                <div className="shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setDeviceToLogout(device)}
                                    disabled={deviceActionLoadingId === device._id}
                                    className="cursor-pointer inline-flex items-center justify-center gap-1 !min-h-0 !min-w-0 h-[22px] sm:h-6 px-2 sm:px-2.5 rounded-md text-[10px] sm:text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {deviceActionLoadingId === device._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    )}
                                    <span>{t('Log Out')}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/**
                             * Connection Metadata
                             * Browser agent and network IP address details
                             */}
                            <div className="text-[11px] sm:text-xs text-gray-500 font-medium mb-2.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-700 font-medium">{device.browser || 'Browser'}</span>
                              <span className="text-gray-300">•</span>
                              <span>IP: <span className="font-mono text-gray-700">{device.ip}</span></span>
                            </div>

                            {/**
                             * Session Activity Times
                             * Live activity status and initial sign-in timestamp
                             */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-gray-50/80 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-100">
                              <div className="min-w-0 text-left">
                                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block leading-tight">
                                  {t('Last active')}
                                </span>
                                <div className="mt-1 flex items-center h-5 text-[11px] sm:text-xs md:text-[13px] truncate">
                                  {device.isCurrentDevice ? (
                                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5 leading-none">
                                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 aspect-square"></span>
                                      <span className="leading-none">{t('Active Now')}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-800 font-medium leading-none truncate">{formatDeviceTime(device.lastActive)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0 text-right">
                                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider block leading-tight">
                                  {t('First signed in')}
                                </span>
                                <div className="mt-1 flex items-center justify-end h-5 text-[11px] sm:text-xs md:text-[13px] text-gray-800 font-medium truncate leading-none">
                                  {formatDeviceDate(device.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/**
             * Account Purge Section
             * Irreversible merchant profile and tenant data termination controls
             */}
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

            {/**
             * Floating Save Bar
             * Sticky status indicator and form save trigger for pending configuration modifications
             */}
            {activeSection !== 'security' && activeSection !== 'account' && activeSection !== 'platform-invoices' && activeSection !== 'devices' && (
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

          {/**
           * Mobile App Version Card
           * Release metadata displayed at the foot of mobile viewport
           */}
          <div className="lg:hidden pt-4 pb-2">
            <AppVersionCard variant="full" />
          </div>
        </div>
      </div>

      {/**
       * Account Deletion Confirmation Modal
       * Final safety prompt verifying merchant intent to permanently destroy tenant data
       */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100]">
          {/**
           * Modal Backdrop Overlay
           * Dimmed background dismissing dialog when clicked
           */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setDeleteModalOpen(false)}
          />

          {/**
           * Deletion Dialog Content
           * Destructive confirmation card with warning and action triggers
           */}
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

      {/**
       * Single Device Logout Confirmation Modal
       * Prompts confirmation before terminating a specific remote session
       */}
      {deviceToLogout && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setDeviceToLogout(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Log Out Device')}</h3>
                <p className="text-gray-500 text-sm mb-3 font-medium">
                  {t('Are you sure you want to log out this device?')}
                </p>
                <div className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-5 text-left">
                  <div className="truncate text-gray-900">{deviceToLogout.device}</div>
                  <div className="text-gray-500 font-normal mt-0.5">IP: {deviceToLogout.ip}</div>
                </div>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setDeviceToLogout(null)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeLogoutDevice(deviceToLogout)}
                    disabled={deviceActionLoadingId === deviceToLogout._id}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deviceActionLoadingId === deviceToLogout._id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Log Out')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/**
       * Global Session Revocation Confirmation Modal
       * Confirms bulk termination of all active sessions except the current device
       */}
      {confirmLogoutOthersModal && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setConfirmLogoutOthersModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Log Out All Other Devices')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to log out all other active devices? Anyone else using your account will be required to log in again.')}
                </p>
                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutOthersModal(false)}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={executeLogoutAllOthers}
                    disabled={loggingOutAllOthers}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loggingOutAllOthers && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Log Out All')}
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
