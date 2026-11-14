/**
 * Administrative Create Shopkeeper Account Modal
 * Enables platform administrators to provision merchant accounts with custom credentials,
 * initial subscription tiers, full business setup (isBusinessSetupCompleted in DB),
 * shop configurations, and immediate account verification.
 * Follows exact production standards matching BusinessSetup.jsx 1:1.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  Store,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Free Trial',
    price: '₹0',
    duration: '7 Days Trial',
    badge: 'STARTER',
  },
  {
    id: 'MONTHLY',
    name: 'Monthly Pro',
    price: '₹299',
    duration: '30 Days',
    badge: '1 MONTH',
  },
  {
    id: 'QUARTERLY',
    name: 'Quarterly Pro',
    price: '₹799',
    duration: '90 Days',
    badge: 'POPULAR',
  },
  {
    id: 'YEARLY',
    name: 'Yearly Pro',
    price: '₹2999',
    duration: '365 Days',
    badge: 'SAVE 16%',
  },
];

const INITIAL_FORM = {
  // Merchant Credentials
  name: '',
  email: '',
  phone: '',
  password: '',

  // Full Business Information (Matching BusinessSetup.jsx)
  isBusinessSetupCompleted: true,
  shopName: '',
  gstNumber: '',
  upiId: '',
  shopPhone: '',
  shopEmail: '',
  invoiceLogo: '',
  signatureImage: '',
  currency: 'INR',
  shopAddress: '',

  // Subscription & Provisioning
  subscriptionPlan: 'FREE',
  trialDays: 7,
  isVerified: true,
  sendWelcomeEmail: false,
};

const CreateShopkeeperModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Reset Form & Lock Viewport Gestures
   */
  useEffect(() => {
    if (!isOpen) return;

    setFormData(INITIAL_FORM);
    setShowPassword(false);
    setCopiedPassword(false);
    setUploadingLogo(false);
    setUploadingSignature(false);
    setErrors({});

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Quick Random Password Generator
   */
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
  };

  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  /**
   * Cloud Media Upload Handlers (Matching BusinessSetup.jsx)
   */
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image size should be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setFormData(prev => ({ ...prev, invoiceLogo: res.data.data.url }));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload logo';
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Signature image size should be less than 5MB');
      return;
    }

    setUploadingSignature(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setFormData(prev => ({ ...prev, signatureImage: res.data.data.url }));
        if (errors.signatureImage) setErrors(prev => ({ ...prev, signatureImage: null }));
        toast.success('Signature uploaded successfully');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload signature';
      toast.error(msg);
    } finally {
      setUploadingSignature(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Merchant full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.phone = 'Please provide a valid 10-digit mobile number';
      }
    } else {
      newErrors.phone = 'Mobile number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Account password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Business details validation
    if (formData.shopPhone && formData.shopPhone.trim()) {
      const shopPhoneDigits = formData.shopPhone.replace(/\D/g, '');
      if (shopPhoneDigits.length < 10) {
        newErrors.shopPhone = 'Please provide a valid 10-digit business phone number';
      }
    }

    if (formData.shopEmail && formData.shopEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.shopEmail.trim())) {
        newErrors.shopEmail = 'Please provide a valid business email address';
      }
    }

    if (formData.gstNumber && formData.gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      if (!gstRegex.test(formData.gstNumber.trim())) {
        newErrors.gstNumber = 'Please enter a valid 15-character GSTIN (e.g. 23ABCDE0000A1A2)';
      }
    }

    if (formData.isBusinessSetupCompleted) {
      if (!formData.shopName.trim()) {
        newErrors.shopName = 'Business / Shop name is required when business setup is completed';
      }
      if (!formData.shopAddress.trim()) {
        newErrors.shopAddress = 'Business address is required when business setup is completed';
      } else if (formData.shopAddress.trim().length < 5) {
        newErrors.shopAddress = 'Business address must be at least 5 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please check the form for errors');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      isBusinessSetupCompleted: Boolean(formData.isBusinessSetupCompleted),
      shopName: formData.shopName.trim() || `${formData.name.trim()}'s Shop`,
      shopPhone: formData.shopPhone.trim() || formData.phone.trim(),
      shopEmail: formData.shopEmail.trim().toLowerCase() || formData.email.trim().toLowerCase(),
      gstNumber: formData.gstNumber.trim().toUpperCase(),
      upiId: formData.upiId.trim(),
      currency: formData.currency,
      invoiceLogo: formData.invoiceLogo.trim(),
      signatureImage: formData.signatureImage.trim(),
      shopAddress: formData.shopAddress.trim(),
      subscriptionPlan: formData.subscriptionPlan,
      trialDays: formData.subscriptionPlan === 'FREE' ? Number(formData.trialDays) : undefined,
      isVerified: Boolean(formData.isVerified),
      sendWelcomeEmail: Boolean(formData.sendWelcomeEmail),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] overscroll-contain">
      {/**
       * Backdrop Overlay
       */}
      <div
        className="fixed inset-0 bg-[#191E2B]/50 backdrop-blur-xs transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/**
       * Modal Container Shell
       */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-6 z-[60] pointer-events-none">
        <div className="relative bg-[#FBFBFC] w-full sm:max-w-3xl rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-[#DCE1EA] animate-modal-content overflow-hidden pointer-events-auto shadow-none">
          
          {/**
           * Mobile Drag Handle
           */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-[#FBFBFC]">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/**
           * Modal Header Toolbar
           */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#E8ECF2] flex items-center justify-between bg-[#FBFBFC] flex-shrink-0 gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#191E2B] leading-snug truncate">
                Create New Shopkeeper Account
              </h3>
              <p className="text-xs text-[#757F94] font-medium truncate mt-0.5">
                Provision merchant credentials, complete business setup, and configure plan
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer text-[#757F94] bg-[#F0F2F6] hover:bg-[#EBEEF4] hover:text-[#191E2B] w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 border border-[#DCE1EA]"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/**
           * Modal Form Body
           */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">

              {/** Section 1: Merchant Credentials */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#757F94] mb-3">
                  Merchant Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/** Name */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                      Merchant Full Name <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Merchant Full Name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                      className={`block w-full rounded-lg border ${
                        errors.name
                          ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                          : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                      } px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                    />
                    {errors.name && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.name}</p>}
                  </div>

                  {/** Email */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                      Email Address <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter Email Address"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      className={`block w-full rounded-lg border ${
                        errors.email
                          ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                          : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                      } px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                    />
                    {errors.email && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.email}</p>}
                  </div>

                  {/** Mobile Number */}
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                      Mobile Number (10 Digits) <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter 10-Digit Mobile Number"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      className={`block w-full rounded-lg border ${
                        errors.phone
                          ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                          : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                      } px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                    />
                    {errors.phone && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.phone}</p>}
                  </div>

                  {/** Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs sm:text-[13px] font-medium text-[#4E5668]">
                        Account Password <span className="text-[#B91C1C]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="cursor-pointer text-[11px] font-semibold text-[#4338CA] hover:text-[#4338CA] flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-[#4338CA]" />
                        Generate Strong
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter Account Password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        className={`block w-full rounded-lg border ${
                          errors.password
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 pr-16 py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                        {formData.password && (
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="cursor-pointer p-1 text-[#757F94] hover:text-[#4E5668] transition-colors"
                            title="Copy Password"
                          >
                            {copiedPassword ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="cursor-pointer p-1 text-[#757F94] hover:text-[#4E5668] transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {errors.password && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/** Section 2: Business Information (Exact 1:1 Matching BusinessSetup.jsx) */}
              <section className="bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] overflow-hidden shadow-none">
                
                {/** Card Header with Store Icon and Subtitle */}
                <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-[#E8ECF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FBFBFC]">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-[#191E2B] flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#4338CA]" />
                      Business Information
                    </h2>
                    <p className="text-xs text-[#757F94] mt-0.5 font-medium">
                      Details shown on your invoices and receipts
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-[#F0F2F6] hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-[#DCE1EA] transition-colors self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={formData.isBusinessSetupCompleted}
                      onChange={(e) => setFormData({ ...formData, isBusinessSetupCompleted: e.target.checked })}
                      className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#3A3550] border-[#DCE1EA] cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#191E2B]">
                      Business Setup Completed (DB: true)
                    </span>
                  </label>
                </div>

                {/** Card Body: All Business Information Inputs */}
                <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6 space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                    {/** 1. Business / Shop Name */}
                    <div className="md:col-span-2">
                      <label htmlFor="shopName" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Business / Shop Name {formData.isBusinessSetupCompleted && <span className="text-[#B91C1C]">*</span>}
                      </label>
                      <input
                        id="shopName"
                        name="shopName"
                        type="text"
                        value={formData.shopName}
                        onChange={(e) => {
                          setFormData({ ...formData, shopName: e.target.value });
                          if (errors.shopName) setErrors({ ...errors, shopName: null });
                        }}
                        className={`block w-full rounded-lg border ${
                          errors.shopName
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                        placeholder="Enter Business / Shop Name"
                      />
                      {errors.shopName && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.shopName}</p>}
                    </div>

                    {/** 2. GST Number */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() });
                          if (errors.gstNumber) setErrors({ ...errors, gstNumber: null });
                        }}
                        placeholder="23ABCDE0000A1A2"
                        className={`block w-full rounded-lg border ${
                          errors.gstNumber
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8] uppercase`}
                      />
                      {errors.gstNumber && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.gstNumber}</p>}
                    </div>

                    {/** 3. UPI Id */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        UPI Id
                      </label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="yourshop@upi"
                        className="block w-full rounded-lg border border-[#DCE1EA] px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]"
                      />
                    </div>

                    {/** 4. Business Phone */}
                    <div>
                      <label htmlFor="shopPhone" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Business Phone {formData.isBusinessSetupCompleted && <span className="text-[#B91C1C]">*</span>}
                      </label>
                      <input
                        id="shopPhone"
                        name="shopPhone"
                        type="tel"
                        value={formData.shopPhone}
                        onChange={(e) => {
                          setFormData({ ...formData, shopPhone: e.target.value });
                          if (errors.shopPhone) setErrors({ ...errors, shopPhone: null });
                        }}
                        className={`block w-full rounded-lg border ${
                          errors.shopPhone
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                        placeholder="+91 98005 00012"
                      />
                      {errors.shopPhone ? (
                        <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.shopPhone}</p>
                      ) : (
                        <p className="text-[#757F94] text-[11px] sm:text-xs mt-1.5 font-medium">
                          Shown on invoices, can differ from personal phone
                        </p>
                      )}
                    </div>

                    {/** 5. Business Email */}
                    <div>
                      <label htmlFor="shopEmail" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Business Email
                      </label>
                      <input
                        id="shopEmail"
                        name="shopEmail"
                        type="email"
                        value={formData.shopEmail}
                        onChange={(e) => {
                          setFormData({ ...formData, shopEmail: e.target.value });
                          if (errors.shopEmail) setErrors({ ...errors, shopEmail: null });
                        }}
                        className={`block w-full rounded-lg border ${
                          errors.shopEmail
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8]`}
                        placeholder="yourshop@gmail.com"
                      />
                      {errors.shopEmail ? (
                        <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.shopEmail}</p>
                      ) : (
                        <p className="text-[#757F94] text-[11px] sm:text-xs mt-1.5 font-medium">
                          Shown on invoices, can differ from personal email
                        </p>
                      )}
                    </div>

                    {/** 6. Invoice Branding Logo */}
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Invoice Logo
                      </label>

                      <div className="flex flex-col items-start gap-4">
                        {formData.invoiceLogo ? (
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg flex items-center justify-center p-2 relative group overflow-hidden shadow-none">
                              <img src={formData.invoiceLogo} alt="Logo" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, invoiceLogo: '' }))}
                                className="absolute top-1.5 right-1.5 cursor-pointer bg-[#4338CA] text-white hover:bg-[#3730A3] w-6 h-6 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[24px] !min-w-[24px] !p-0 shadow-none z-10"
                                title="Remove Logo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col items-start justify-center">
                              <span className="text-[13px] sm:text-sm font-semibold text-[#191E2B]">Logo Uploaded</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                              <label className={`cursor-pointer w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 rounded-lg border border-[#DCE1EA] text-[#4E5668] font-medium text-xs md:text-sm transition-colors ${uploadingLogo ? 'opacity-50' : 'hover:bg-[#F0F2F6] hover:text-[#191E2B] active:bg-gray-100'}`}>
                                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-[#4338CA]" /> : <Upload className="w-4 h-4 text-[#757F94]" />}
                                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                              </label>

                              <div className="flex-1 w-full flex items-center gap-2">
                                <span className="text-[#757F94] font-medium text-xs md:text-sm hidden md:inline-block">Or</span>
                                <input
                                  type="url"
                                  name="invoiceLogo"
                                  value={formData.invoiceLogo}
                                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceLogo: e.target.value }))}
                                  placeholder="Enter image URL (https://...)"
                                  className="block w-full rounded-lg border border-[#DCE1EA] px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium text-[#191E2B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] placeholder-[#9AA4B8]"
                                />
                              </div>
                            </div>
                            <p className="text-[#757F94] text-[11px] sm:text-xs font-medium">
                              Upload from your device or paste an image URL. Recommended size: 400x150px. Max 5MB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/** 7. Authorized Signature */}
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Authorized Signature <span className="text-[#757F94] font-normal text-xs">(Optional)</span>
                      </label>

                      <div className="flex flex-col items-start gap-4">
                        {formData.signatureImage ? (
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-16 sm:w-32 sm:h-20 shrink-0 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg flex items-center justify-center p-2 relative group overflow-hidden shadow-none">
                              <img src={formData.signatureImage} alt="Signature" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, signatureImage: '' }))}
                                className="absolute top-1.5 right-1.5 cursor-pointer bg-[#4338CA] text-white hover:bg-[#3730A3] w-6 h-6 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[24px] !min-w-[24px] !p-0 shadow-none z-10"
                                title="Remove Signature"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col items-start justify-center">
                              <span className="text-[13px] sm:text-sm font-semibold text-[#191E2B]">Signature Uploaded</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
                              <label className={`cursor-pointer w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 rounded-lg border ${errors.signatureImage ? 'border-red-400' : 'border-[#DCE1EA]'} text-[#4E5668] font-medium text-xs md:text-sm transition-colors ${uploadingSignature ? 'opacity-50' : 'hover:bg-[#F0F2F6] hover:text-[#191E2B] active:bg-gray-100'}`}>
                                {uploadingSignature ? <Loader2 className="w-4 h-4 animate-spin text-[#4338CA]" /> : <Upload className="w-4 h-4 text-[#757F94]" />}
                                <span>{uploadingSignature ? 'Uploading...' : 'Upload Signature'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                              </label>

                              <div className="flex-1 w-full flex items-center gap-2">
                                <span className="text-[#757F94] font-medium text-xs md:text-sm hidden md:inline-block">Or</span>
                                <input
                                  type="url"
                                  name="signatureImage"
                                  value={formData.signatureImage}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, signatureImage: e.target.value }));
                                    if (errors.signatureImage) setErrors(prev => ({ ...prev, signatureImage: null }));
                                  }}
                                  placeholder="Enter signature image URL (https://...)"
                                  className={`block w-full rounded-lg border ${
                                    errors.signatureImage
                                      ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                                      : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                                  } px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium text-[#191E2B] placeholder-[#9AA4B8] bg-[#FBFBFC] transition-colors duration-200 focus:outline-none`}
                                />
                              </div>
                            </div>
                            {errors.signatureImage && (
                              <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.signatureImage}</p>
                            )}
                            <p className="text-[#757F94] text-[11px] sm:text-xs font-medium">
                              Upload from your device or paste an image URL. Recommended size: 300x100px. Max 5MB.
                            </p>
                            <p className="text-[#757F94] text-[11px] sm:text-xs font-medium">
                              Leave blank to automatically generate digital signature from merchant name
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/** 8. Default Currency */}
                    <div>
                      <label htmlFor="currency" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Default Currency
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="block w-full rounded-lg border border-[#DCE1EA] px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] text-[#191E2B] cursor-pointer"
                      >
                        <option value="INR">₹ INR</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>

                    {/** 9. Shop Address */}
                    <div className="md:col-span-2">
                      <label htmlFor="shopAddress" className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                        Shop Address {formData.isBusinessSetupCompleted && <span className="text-[#B91C1C]">*</span>}
                      </label>
                      <textarea
                        id="shopAddress"
                        name="shopAddress"
                        rows={3}
                        value={formData.shopAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, shopAddress: e.target.value });
                          if (errors.shopAddress) setErrors({ ...errors, shopAddress: null });
                        }}
                        className={`block w-full rounded-lg border ${
                          errors.shopAddress
                            ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                            : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
                        } px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none bg-[#FBFBFC] text-[#191E2B] placeholder-[#9AA4B8] resize-none`}
                        placeholder="Enter full business address (Building, Street, City, State, PIN)"
                      />
                      {errors.shopAddress && <p className="text-[#B91C1C] text-xs mt-1 font-medium">{errors.shopAddress}</p>}
                    </div>

                  </div>
                </div>
              </section>

              {/** Section 3: Subscription Plan Allocation */}
              <div className="pt-2 border-t border-[#DCE1EA]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#757F94]">
                    Initial Subscription Plan
                  </h4>
                  <span className="text-[11px] font-semibold text-[#4338CA] bg-[#EEF0FB] px-2.5 py-0.5 rounded-full border border-[#D8DCF5]">
                    Admin Complimentary
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isSelected = formData.subscriptionPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id })}
                        className={`cursor-pointer p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#4338CA] text-white border-[#4338CA]'
                            : 'bg-[#FBFBFC] text-[#191E2B] border-[#DCE1EA] hover:border-gray-400 hover:bg-[#F0F2F6]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{plan.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-[#585272] text-[#F4EFF3]'
                                : 'bg-gray-100 text-[#4E5668]'
                            }`}
                          >
                            {plan.badge}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#191E2B]'}`}>
                            {plan.price}
                          </span>
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-[#DCD3E0]' : 'text-[#757F94]'}`}>
                            / {plan.duration}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/** Custom Trial Days if Free Trial */}
                {formData.subscriptionPlan === 'FREE' && (
                  <div className="mt-3 p-3 bg-[#F0F2F6] border border-[#DCE1EA] rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-[#191E2B] block">
                        Trial Validity Days
                      </span>
                      <span className="text-[11px] text-[#757F94] font-medium">
                        Number of days free trial remains active before prompt
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="365"
                        step="1"
                        value={formData.trialDays}
                        onChange={(e) =>
                          setFormData({ ...formData, trialDays: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })
                        }
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                        }}
                        onFocus={(e) => e.target.select()}
                        onWheel={(e) => e.target.blur()}
                        className="w-16 h-8 text-center text-xs font-semibold text-[#191E2B] bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-medium text-[#4E5668]">Days</span>
                    </div>
                  </div>
                )}
              </div>

              {/** Section 4: Provisioning Options */}
              <div className="pt-2 border-t border-[#DCE1EA] space-y-2.5">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE1EA] bg-[#F0F2F6]/50 cursor-pointer hover:bg-[#F0F2F6] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#3A3550] border-[#DCE1EA] cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-[#191E2B]">
                        Pre-Verify Email & Account Access (Recommended)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#757F94] font-medium">
                      Bypasses initial OTP email verification so the shopkeeper can log in immediately with their credentials.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE1EA] bg-[#F0F2F6]/50 cursor-pointer hover:bg-[#F0F2F6] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.sendWelcomeEmail}
                    onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#3A3550] border-[#DCE1EA] cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#191E2B] block">
                      Send Welcome Email Notification
                    </span>
                    <p className="text-[11px] text-[#757F94] font-medium">
                      Sends a welcome email to the merchant informing them about their registered store account.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            {/**
             * Modal Footer Toolbar
             */}
            <div className="px-5 sm:px-6 py-3.5 bg-[#F0F2F6] border-t border-[#DCE1EA] flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="cursor-pointer px-4 py-2 text-xs sm:text-sm font-semibold text-[#4E5668] hover:text-[#191E2B] bg-[#FBFBFC] hover:bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || uploadingLogo || uploadingSignature}
                className="cursor-pointer px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] border border-[#4338CA] rounded-lg flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Store...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Shopkeeper</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default CreateShopkeeperModal;
