import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Store, 
  Users, 
  Receipt, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BarChart3,
  Clock,
  Globe
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Receipt,
      titleKey: 'Smart Billing',
      descriptionKey: 'Create professional bills in seconds with our intuitive interface',
      color: 'blue'
    },
    {
      icon: Users,
      titleKey: 'Customer Management',
      descriptionKey: 'Track customers, credit history, and payment patterns easily',
      color: 'indigo'
    },
    {
      icon: BarChart3,
      titleKey: 'Business Insights',
      descriptionKey: 'Real-time analytics and reports to grow your business',
      color: 'purple'
    },
    {
      icon: Shield,
      titleKey: 'Secure & Reliable',
      descriptionKey: 'Bank-grade security with 99.9% uptime guarantee',
      color: 'green'
    },
    {
      icon: Zap,
      titleKey: 'Voice Billing',
      descriptionKey: 'Create bills using voice commands in your language',
      color: 'orange'
    },
    {
      icon: Clock,
      titleKey: 'Auto Reminders',
      descriptionKey: 'Automated payment reminders via SMS and WhatsApp',
      color: 'pink'
    }
  ];

  const stats = [
    { value: '10,000+', labelKey: 'Active Shops' },
    { value: '₹50Cr+', labelKey: 'Transactions' },
    { value: '99.9%', labelKey: 'Uptime' },
    { value: '4.9/5', labelKey: 'Rating' }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div 
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header - Clean Navbar */}
        <header className="border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo - Left */}
              <div className="flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">BakiPay</span>
              </div>

              {/* Right Side - Language + Sign In Button */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher variant="compact" />
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('Sign In')}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Top Badge */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-full max-w-full">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700 text-center break-words">
                  {t('Trusted by 10,000+ Shopkeepers')}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left order-1">
                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  {t("Your Shop's")}
                  <br />
                  <span className="text-blue-600">{t('Digital Partner')}</span>
                </h1>
                
                {/* Description */}
                <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t('Complete billing, udhar tracking, and business analytics in one place. Built specifically for Indian shopkeepers.')}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6 sm:mb-8">
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs sm:text-sm text-blue-700 font-medium whitespace-nowrap">
                    {t('✓ Voice Billing')}
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs sm:text-sm text-blue-700 font-medium whitespace-nowrap">
                    {t('✓ Udhar Tracking')}
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs sm:text-sm text-blue-700 font-medium whitespace-nowrap">
                    {t('✓ Auto Reminders')}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => navigate('/register')}
                    className="group px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white rounded-lg font-semibold text-sm md:text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{t('Get Started Free')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 md:px-8 py-3 md:py-4 bg-white text-gray-700 rounded-lg font-semibold text-sm md:text-base border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    {t('Sign In')}
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 sm:mt-8 flex items-center gap-4 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{t('Free Forever Plan')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{t('No Credit Card')}</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Stats Grid */}
              <div className="order-2">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {stats.map((stat, index) => (
                    <div 
                      key={index} 
                      className="p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 transition-colors"
                    >
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">
                        {t(stat.labelKey)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Info Card */}
                <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                        {t('Start in Minutes')}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {t('Quick setup, no technical knowledge required. Start managing your business today.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                {t('Everything You Need')}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t('Powerful features to manage your business efficiently')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-5 sm:p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-600 transition-colors"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-600 transition-colors">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-blue-200 rounded-full mb-3 sm:mb-4">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700">{t('Complete Business Solution')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                {t('Why BakiPay?')}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                {t('Everything you need to manage and grow your business')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
              {[
                { textKey: 'Easy Udhar (Credit) Tracking', icon: CheckCircle },
                { textKey: 'Voice-Enabled Billing', icon: CheckCircle },
                { textKey: 'Automated Payment Reminders', icon: CheckCircle },
                { textKey: 'Multi-language Support', icon: CheckCircle },
                { textKey: 'Real-time Business Reports', icon: CheckCircle },
                { textKey: 'Mobile & Desktop Access', icon: CheckCircle },
                { textKey: 'Customer Payment History', icon: CheckCircle },
                { textKey: 'Secure Data Backup', icon: CheckCircle }
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">{t(benefit.textKey)}</span>
                </div>
              ))}
            </div>

            <div className="text-center bg-white border-2 border-blue-200 rounded-2xl p-6 sm:p-8">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {t('Start Your Free Trial')}
              </button>
              <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">{t('No credit card required • Free forever plan available')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center border-2 border-gray-200 rounded-2xl sm:rounded-3xl p-8 sm:p-12 bg-white">
            <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              {t('Ready to Go Digital?')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t('Join thousands of shopkeepers who are growing their business with BakiPay. Start your free trial today.')}
            </p>
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              {t('Create Free Account')}
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo - Text Only */}
            <div>
              <span className="font-bold text-gray-900 text-lg">BakiPay</span>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              {t('© 2024 BakiPay. All rights reserved.')}
            </p>
            
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">{t('Privacy')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors">{t('Terms')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors">{t('Support')}</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
