import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mail, Phone, MapPin, Send, User, MessageSquare } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ContactSupport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">

              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-[22px] sm:text-[24px] md:text-[28px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] md:w-2 md:h-2 rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
              </div>
            </div>

            {/* Right Side */}
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

      {/* Main Content */}
      <main className="flex-1 pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-gray-900 mb-4">{t('Contact Support')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('We are here to help. Get in touch with us and we\'ll get back to you as soon as possible.')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 transition-colors hover:border-[#093C5D]/30">
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mb-6">{t('Get in Touch')}</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Email Address')}</h3>
                  <a href="mailto:support@udharpay.in" className="text-gray-600 hover:text-[#093C5D] transition-colors">support@udharpay.in</a>
                  <p className="text-sm text-gray-500 mt-1">{t('We reply within 24 hours')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Phone Number')}</h3>
                  <a href="tel:+919876543210" className="text-gray-600 hover:text-[#093C5D] transition-colors">+91 98765 43210</a>
                  <p className="text-sm text-gray-500 mt-1">{t('Mon-Sat, 9am to 6pm')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900 mb-1">{t('Office Address')}</h3>
                  <p className="text-gray-600">Level 4, Digital Park, Cyber Hub<br/>Bangalore, Karnataka 560001<br/>India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 transition-colors hover:border-[#093C5D]/30">
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mb-6">{t('Send us a Message')}</h2>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-center">
                <p className="font-medium">{t('Message sent successfully!')}</p>
                <p className="text-sm mt-1">{t('We will get back to you shortly.')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('Your Name')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow"
                      placeholder={t('Enter your full name')}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('Email Address')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow"
                      placeholder={t('Enter your email')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t('Message')}</label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-0 pl-3.5 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow resize-none"
                      placeholder={t('How can we help you?')}
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-[#093C5D] text-white rounded-lg font-semibold text-base hover:bg-[#072C44] transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  {t('Send Message')}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
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
