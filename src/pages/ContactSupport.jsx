/**
 * Public Customer Care & Helpdesk Ticket Submission Page
 * Submits technical issues and billing inquiries directly to the administrative support queue.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { submitPublicSupportTicket, getPublicContactInfo } from '../features/admin/api/adminApi';

/**
 * ContactSupport Component
 */
const ContactSupport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'GENERAL',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    supportEmail: 'support@udharpay.in',
    supportPhone: '+91 98765 43210',
    companyAddress: 'Level 4, Digital Park, Cyber Hub\nBangalore, Karnataka 560001\nIndia',
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const info = await getPublicContactInfo();
        if (info) {
          setContactInfo({
            supportEmail: info.supportEmail || 'support@udharpay.in',
            supportPhone: info.supportPhone || '+91 98765 43210',
            companyAddress: info.companyAddress || 'Level 4, Digital Park, Cyber Hub\nBangalore, Karnataka 560001\nIndia',
          });
        }
      } catch (e) {
        /**
         * Fallback Contact Information
         * Uses hardcoded company address, email, and phone if settings endpoint fails.
         */
      }
    };
    fetchContactInfo();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = t('Full name is required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('Name must be at least 2 characters');
    } else if (formData.name.trim().length > 100) {
      newErrors.name = t('Name cannot exceed 100 characters');
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = t('Email address is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = t('Please enter a valid email address');
      }
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneClean = formData.phone.trim().replace(/[\s\-]/g, '');
      const phoneRegex = /^(?:\+?91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneClean)) {
        newErrors.phone = t('Please enter a valid 10-digit mobile number');
      }
    }

    if (formData.subject && formData.subject.trim() && formData.subject.trim().length < 3) {
      newErrors.subject = t('Subject must be at least 3 characters');
    }

    if (!formData.message || !formData.message.trim()) {
      newErrors.message = t('Message is required');
    } else if (formData.message.trim().length < 5) {
      newErrors.message = t('Message must be at least 5 characters');
    } else if (formData.message.trim().length > 3000) {
      newErrors.message = t('Message cannot exceed 3000 characters');
    }

    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (validationErrors) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || t('Please correct the errors in the form'));
      return;
    }

    setLoading(true);
    try {
      const res = await submitPublicSupportTicket(formData);
      setSubmittedTicket(res?.data || { ticketId: 'SUBMITTED' });
      toast.success(t('Message sent successfully!'));
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        category: 'GENERAL',
        subject: '',
        message: '',
      });
      setErrors({});
    } catch (err) {
      toast.error(err?.response?.data?.message || t('Failed to send message. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans flex flex-col">
      {/**
       * Support Page Navigation Bar
       * Top navbar with UdharPay branding, locale switcher, and sign-in action button.
       */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            {/**
             * Brand Logo & Homepage Link
             * Direct route trigger to homepage.
             */}
            <div className="flex items-center gap-4">

              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-[22px] sm:text-[24px] md:text-[28px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] md:w-2 md:h-2 rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
              </div>
            </div>

            {/**
             * Right Action Controls
             * Language selector dropdown and login route link.
             */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <LanguageSwitcher variant="default" />
              <button
                onClick={() => navigate('/login')}
                className="cursor-pointer px-4 sm:px-5 h-9 flex items-center justify-center text-sm font-medium text-white bg-[#093C5D] rounded-md hover:bg-[#072C44] transition-colors"
              >
                {t('Sign in')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/**
       * Main Support Content Container
       * Grid layout separating company contact info and interactive inquiry form.
       */}
      <main className="flex-1 pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-gray-900 mb-4">{t('Contact Support')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('We are here to help. Get in touch with us and we\'ll get back to you as soon as possible.')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/**
           * Company Contact Information Card
           * Official corporate office address, support email, and helpline phone numbers.
           */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 transition-colors hover:border-[#093C5D]/30">
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mb-6">{t('Get in Touch')}</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Email Address')}</h3>
                  <a href={`mailto:${contactInfo.supportEmail}`} className="text-gray-600 hover:text-[#093C5D] transition-colors">{contactInfo.supportEmail}</a>
                  <p className="text-sm text-gray-500 mt-1">{t('We reply within 24 hours')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Phone Number')}</h3>
                  <a href={`tel:${contactInfo.supportPhone.replace(/\s+/g, '')}`} className="text-gray-600 hover:text-[#093C5D] transition-colors">{contactInfo.supportPhone}</a>
                  <p className="text-sm text-gray-500 mt-1">{t('Mon-Sat, 9am to 6pm')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Office Address')}</h3>
                  <p className="text-gray-600 whitespace-pre-line">{contactInfo.companyAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/**
           * Public Support Inquiry Form
           * Contact form for registered merchants and prospective users to submit helpdesk tickets.
           */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 transition-colors hover:border-[#093C5D]/30">
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mb-6">{t('Send us a Message')}</h2>
            
            {submittedTicket ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-emerald-900">
                  {t('Message sent successfully!')}
                </h3>
                <p className="text-sm text-emerald-700 max-w-md mx-auto">
                  {t('Thank you for reaching out. Your support inquiry has been registered with our team.')}
                </p>
                {submittedTicket.ticketId && (
                  <div className="inline-block bg-white border border-emerald-300 px-4 py-2 rounded-lg text-xs font-mono font-bold text-[#093C5D] tracking-wider">
                    Ticket Reference: #{submittedTicket.ticketId}
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmittedTicket(null)}
                    className="cursor-pointer text-xs font-semibold text-[#093C5D] hover:underline"
                  >
                    {t('Send another inquiry')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Your Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                    } px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('Enter your full name')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Email Address')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                    } px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('Enter your email address')}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Phone Number')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      errors.phone
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                    } px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('Enter phone number')}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Topic / Category')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] cursor-pointer appearance-none pr-9"
                    >
                      <option value="GENERAL">{t('General Inquiry')}</option>
                      <option value="BILLING">{t('Billing & Subscriptions')}</option>
                      <option value="TECHNICAL">{t('Technical Problem')}</option>
                      <option value="ACCOUNT">{t('Account & Access')}</option>
                      <option value="FEATURE_REQUEST">{t('Feature Suggestion')}</option>
                      <option value="BUG_REPORT">{t('Report a Bug')}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Subject')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      errors.subject
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                    } px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none`}
                    placeholder={t('Enter subject')}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.subject}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                    {t('Message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      errors.message
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-[#093C5D] focus:border-[#093C5D]'
                    } px-3.5 py-2.5 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal transition-colors duration-200 focus:ring-1 focus:outline-none resize-none`}
                    placeholder={t('Enter message')}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cursor-pointer py-2.5 sm:py-3 bg-[#093C5D] text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-[#072C44] transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>{t('Sending inquiry...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('Send Message')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/**
       * Support Page Footer
       * Links to privacy policy, terms of service, and developer credentials.
       */}
      <footer className="bg-white border-t border-gray-200 py-8 md:py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5 md:gap-6">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-[22px] sm:text-[24px] md:text-[28px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] md:w-2 md:h-2 rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 md:gap-10 text-sm text-gray-600 font-medium">
              <span onClick={() => navigate('/privacy-policy')} className="cursor-pointer hover:text-[#093C5D] transition-colors">{t('Privacy Policy')}</span>
              <span onClick={() => navigate('/terms-of-service')} className="cursor-pointer hover:text-[#093C5D] transition-colors">{t('Terms of Service')}</span>
              <span onClick={() => navigate('/contact-support')} className="cursor-pointer hover:text-[#093C5D] transition-colors">{t('Contact Support')}</span>
            </div>
          </div>
          
          <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-center">
            <p className="text-sm text-gray-500 font-medium order-3 md:order-1 mt-2 md:mt-0">
              {t(`© ${new Date().getFullYear()} UdharPay. All rights reserved.`)}
            </p>
            
            <p className="text-sm text-gray-600 font-medium flex items-center justify-center gap-1.5 order-1 md:order-2">
              {t('Developer:')} <span className="font-medium text-gray-900 tracking-wide">Developed with ❤️ by</span> <span className="text-[#093C5D] font-semibold animate-pulse">ANKIT</span>
            </p>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactSupport;
