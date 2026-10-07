import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Save, Loader2, AlertCircle, Upload, X } from 'lucide-react';
import api from '../api/axios';
import { setUser, logout } from '../redux/slices/authSlice';

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
  
  // Checking if changes are made to enable the Save button
  const hasChanges = formData.shopName.trim() !== '' && formData.shopPhone.trim() !== '' && formData.shopAddress.trim() !== '';

  useEffect(() => {
    if (user?.isBusinessSetupCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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
    if (!formData.shopName.trim()) newErrors.shopName = t('Business Name is required');
    
    if (!formData.shopPhone.trim()) {
      newErrors.shopPhone = t('Business Phone is required');
    } else {
      const phoneRegex = /^(?:\+?91[\-\s]?)?[0]?(?:\d[\-\s]?){10}$/;
      if (!phoneRegex.test(formData.shopPhone.trim())) {
        newErrors.shopPhone = t('Please enter a valid phone number');
      }
    }
    
    if (!formData.shopAddress.trim()) newErrors.shopAddress = t('Business Address is required');
    
    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (validationErrors) {
      setErrors(validationErrors);
      toast.error(t('Please check the form for errors'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/complete-onboarding', formData);
      
      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.data };
        dispatch(setUser(updatedUser));
        toast.success(t('Business details saved successfully!'));
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('Something went wrong. Please try again.');
      setErrors({ global: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans flex flex-col justify-center">
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Intro */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t('Welcome to UdharPay!')}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium max-w-2xl">
            {t("Let's set up your business profile. This information will be used on your invoices, receipts, and reports.")}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card (Matching Settings.jsx EXACTLY) */}
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
              
              {/* Global Error Message */}
              {errors.global && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="block sm:inline">{errors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                
                {/* Shop Name */}
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
                    placeholder={t('e.g. Sharma General Store')}
                  />
                  {errors.shopName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.shopName}</p>}
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">{t('GST Number')}</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="23ABCDE0000A1A2"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  />
                </div>
                
                {/* UPI Id */}
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

                {/* Business Phone */}
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

                {/* Business Email */}
                <div>
                  <label htmlFor="shopEmail" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Business Email')}
                  </label>
                  <input
                    id="shopEmail"
                    name="shopEmail"
                    type="email"
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    title="Please enter a valid email address"
                    value={formData.shopEmail}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                    placeholder={t('yourshop@gmail.com')}
                  />
                  <p className="text-gray-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('Shown on invoices, can differ from personal email')}</p>
                </div>

                {/* Invoice Logo */}
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

                {/* Currency */}
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

                {/* Address */}
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

          {/* Action Buttons (Matching Settings.jsx sticky button bar exactly) */}
          <div className="sticky bottom-4 z-20 mt-8">
            <div className="bg-white border border-gray-200 p-2 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full">
              <div className="hidden sm:flex items-center gap-2 text-sm ml-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-gray-500 font-medium">
                  {t('Please complete setup to proceed')}
                </span>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors duration-300 active:scale-[0.98] whitespace-nowrap"
                >
                  {t('Logout')}
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'}`}
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
