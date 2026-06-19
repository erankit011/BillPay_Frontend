import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
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
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo.png" alt="UdharPay Logo" className="h-8 sm:h-10 md:h-12 object-contain" />
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('Contact Support')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('We are here to help. Get in touch with us and we\'ll get back to you as soon as possible.')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">{t('Get in Touch')}</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('Email Address')}</h3>
                  <a href="mailto:support@udharpay.in" className="text-gray-600 hover:text-[#093C5D] transition-colors">support@udharpay.in</a>
                  <p className="text-sm text-gray-500 mt-1">{t('We reply within 24 hours')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('Phone Number')}</h3>
                  <a href="tel:+919876543210" className="text-gray-600 hover:text-[#093C5D] transition-colors">+91 98765 43210</a>
                  <p className="text-sm text-gray-500 mt-1">{t('Mon-Sat, 9am to 6pm')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#093C5D]/10 rounded-full flex items-center justify-center text-[#093C5D]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('Office Address')}</h3>
                  <p className="text-gray-600">Level 4, Digital Park, Cyber Hub<br/>Bangalore, Karnataka 560001<br/>India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">{t('Send us a Message')}</h2>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-center">
                <p className="font-medium">{t('Message sent successfully!')}</p>
                <p className="text-sm mt-1">{t('We will get back to you shortly.')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('Your Name')}</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow"
                    placeholder={t('Enter your full name')}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('Email Address')}</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow"
                    placeholder={t('Enter your email')}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t('Message')}</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none transition-shadow resize-none"
                    placeholder={t('How can we help you?')}
                  ></textarea>
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

      {/* Footer minimal */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} UdharPay. {t('All rights reserved.')}
            </p>
        </div>
      </footer>
    </div>
  );
};

export default ContactSupport;
