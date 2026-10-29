/**
 * Merchant Business Profile Onboarding Page
 * Collects shop legal name, store phone, address, GSTIN, UPI VPA, and invoice branding logo.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Save, Loader2, AlertCircle, Upload, X } from 'lucide-react';
import api from '../api/axios';
import { setUser } from '../redux/slices/authSlice';

/**
 * BusinessSetup Component
 */
const BusinessSetup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    currency: 'INR',
    gstNumber: '',
    upiId: '',
    shopEmail: '',
    invoiceLogo: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Save State Validation
   * Checks whether essential mandatory business fields are populated
   */
  const hasChanges = formData.shopName.trim() !== '' && formData.shopPhone.trim() !== '' && formData.shopAddress.trim() !== '';

  useEffect(() => {
    if (user?.phone || user?.email) {
      setFormData(prev => ({
        ...prev,
        shopPhone: prev.shopPhone || user?.phone || '',
        shopEmail: prev.shopEmail || user?.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ global: t('Image size should be less than 5MB') });
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFormData(prev => ({ ...prev, invoiceLogo: res.data.data.url }));
        setErrors(prev => ({ ...prev, global: '' }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('Failed to upload logo');
      setErrors({ global: msg });
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.shopName.trim()) {
      newErrors.shopName = t('Business Name is required');
    } else if (formData.shopName.trim().length < 2) {
      newErrors.shopName = t('Business Name must be at least 2 characters');
    }

    if (!formData.shopPhone.trim()) {
      newErrors.shopPhone = t('Business Phone is required');
    } else {
      const phoneRegex = /^(?:\+?91[\-\s]?)?[0]?(?:\d[\-\s]?){10}$/;
      if (!phoneRegex.test(formData.shopPhone.trim())) {
        newErrors.shopPhone = t('Please enter a valid 10-digit phone number');
      }
    }

    if (!formData.shopAddress.trim()) {
      newErrors.shopAddress = t('Business Address is required');
    } else if (formData.shopAddress.trim().length < 5) {
      newErrors.shopAddress = t('Business Address must be at least 5 characters');
    }

    if (formData.shopEmail && formData.shopEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.shopEmail.trim())) {
        newErrors.shopEmail = t('Please enter a valid email address');
      }
    }

    if (formData.gstNumber && formData.gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      if (!gstRegex.test(formData.gstNumber.trim())) {
        newErrors.gstNumber = t('Please enter a valid 15-character GSTIN');
      }
    }

    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (validationErrors) {
      setErrors(validationErrors);
      toast.error(t('Please check the form for errors'), { id: 'business-setup-val-error', duration: 4000 });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/complete-onboarding', formData);

      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.data };
        dispatch(setUser(updatedUser));
        toast.success(t('Business details saved successfully!'), { id: 'business-setup-success', duration: 4000 });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('Something went wrong. Please try again.');
      setErrors({ global: msg });
      toast.error(msg, { id: 'business-setup-api-error', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans flex flex-col justify-center">
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/**
         * Page Introduction Header
         * Greets new merchant and explains purpose of profile completion
         */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            {t('Welcome to UdharPay!')}
          </h2>
          <p className="mt-1 text-sm text-gray-600 font-medium max-w-2xl leading-relaxed">
            {t("Let's set up your business profile. This information will be used on your invoices, receipts, and reports.")}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/**
           * Business Details Form Container
           * Card housing business identity, billing, and address fields
           */}
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">

            <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#093C5D]" />
                  {t('Business Information')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('Details shown on your invoices and receipts')}
                </p>
              </div>
            </div>

            <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">

              {/**
               * Global Form Error Banner
               * Displays top-level API validation failure messages
               */}
              {errors.global && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="block sm:inline">{errors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                {/**
                 * Business / Shop Name Field
                 * Primary merchant identification used on invoices
                 */}
                <div className="md:col-span-2">
                  <label htmlFor="shopName" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Business / Shop Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shopName"
                    name="shopName"
                    type="text"
                    value={formData.shopName}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.shopName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('Enter Business / Shop Name')}
                  />
                  {errors.shopName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.shopName}</p>}
                </div>

                {/**
                 * GST Number Input Field
                 * Optional tax registration identifier for GST invoices
                 */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('GST Number')}</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="23ABCDE0000A1A2"
                    className={`block w-full rounded-lg border ${errors.gstNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none`}
                  />
                  {errors.gstNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.gstNumber}</p>}
                </div>

                {/**
                 * UPI VPA Payment Address
                 * Merchant UPI ID printed on invoices for direct customer payments
                 */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('UPI Id')}</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleChange}
                    placeholder="yourshop@upi"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  />
                </div>

                {/**
                 * Business Contact Phone
                 * Public store telephone number displayed to customers
                 */}
                <div>
                  <label htmlFor="shopPhone" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Business Phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="shopPhone"
                    name="shopPhone"
                    type="tel"
                    value={formData.shopPhone}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.shopPhone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('+91 98005 00012')}
                  />
                  {errors.shopPhone ? (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.shopPhone}</p>
                  ) : (
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Shown on invoices, can differ from personal phone')}</p>
                  )}
                </div>

                {/**
                 * Business Contact Email
                 * Official support email printed on transaction receipts
                 */}
                <div>
                  <label htmlFor="shopEmail" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Business Email')}
                  </label>
                  <input
                    id="shopEmail"
                    name="shopEmail"
                    type="email"
                    value={formData.shopEmail}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.shopEmail ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('yourshop@gmail.com')}
                  />
                  {errors.shopEmail ? (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.shopEmail}</p>
                  ) : (
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Shown on invoices, can differ from personal email')}</p>
                  )}
                </div>

                {/**
                 * Invoice Branding Logo
                 * Image uploader and URL input for customized invoice header branding
                 */}
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
                </div>

                {/**
                 * Default Store Currency Selector
                 * Specifies default currency symbol and formatting for billing
                 */}
                <div>
                  <label htmlFor="currency" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Default Currency')}
                  </label>
                  <select
                    id="currency"
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
                    <option value="INR">{t('₹ INR')}</option>
                    <option value="USD">{t('$ USD')}</option>
                  </select>
                </div>

                {/**
                 * Physical Store Address
                 * Complete postal address rendered on billings and receipts
                 */}
                <div className="md:col-span-2">
                  <label htmlFor="shopAddress" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Shop Address')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="shopAddress"
                    name="shopAddress"
                    rows={3}
                    value={formData.shopAddress}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${errors.shopAddress ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'} px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none resize-none`}
                    placeholder={t('Enter full business address (Building, Street, City, State, PIN)')}
                  />
                  {errors.shopAddress && <p className="text-red-500 text-xs mt-1 font-medium">{errors.shopAddress}</p>}
                </div>
              </div>
            </div>
          </section>

          {/**
           * Sticky Form Action Bar
           * Submit button and status indicator anchored at the viewport base
           */}
          <div className="sticky bottom-4 z-20 mt-8">
            <div className="bg-white border border-gray-200 p-2 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full shadow-none">
              <div className="flex items-center gap-2 text-sm ml-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-gray-500 font-medium text-xs sm:text-sm">
                  {t('Please complete setup to proceed')}
                </span>
              </div>
              <div className="flex w-full sm:w-auto items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 shadow-none ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      <span className="tracking-wide">{t('Saving...')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 shrink-0" />
                      <span className="tracking-wide">{t('Save & Continue')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BusinessSetup;
