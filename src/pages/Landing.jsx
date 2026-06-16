import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid Background - Same as Dashboard */}
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(199, 196, 216, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(199, 196, 216, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header - Mobile-Optimized Navbar */}
        <header className="bg-white/70 backdrop-blur-3xl fixed top-0 w-full z-50 border-b border-white/20 shadow-sm safe-top">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <span className="text-lg sm:text-xl md:text-2xl font-semibold text-indigo-600 tracking-tight">BakiPay</span>
              </div>

              {/* Right Side - Language + Sign In Button */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="hidden xs:block">
                  <LanguageSwitcher variant="compact" />
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="cursor-pointer px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-full active:scale-95 transition-transform duration-150 shadow-lg touch-manipulation"
                >
                  {t('Sign In')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="pt-14 sm:pt-16" />

        {/* Hero Section - Mobile-First Responsive */}
        <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 xl:py-24 max-w-7xl mx-auto">
          <div className="w-full">
            {/* Top Badge - Mobile Optimized */}
            <div className="flex justify-center mb-8 sm:mb-10 px-2">
              <div className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 glass-card rounded-full text-indigo-600 max-w-[90vw] text-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ fill: 'currentColor' }} />
                <span className="text-sm sm:text-base font-medium">
                  {t('Trusted by 10,000+ Shopkeepers')}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content - Mobile Optimized */}
              <div className="text-center lg:text-left order-1 space-y-6 sm:space-y-8">
                {/* Main Heading - Responsive Typography */}
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 leading-tight">
                  {t("Your Shop's")}
                  <br />
                  <span className="text-indigo-600">{t('Digital Partner')}</span>
                </h1>

                {/* Description - Mobile Optimized */}
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {t('Complete billing, udhar tracking, and business analytics in one place. Built specifically for modern Indian shopkeepers to scale effortlessly.')}
                </p>

                {/* Feature Pills - Mobile Responsive */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <div className="px-4 py-2 sm:px-5 sm:py-2.5 glass-card rounded-full text-sm sm:text-base text-indigo-600 font-medium flex items-center gap-2 touch-manipulation">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('Voice Billing')}
                  </div>
                  <div className="px-4 py-2 sm:px-5 sm:py-2.5 glass-card rounded-full text-sm sm:text-base text-indigo-600 font-medium flex items-center gap-2 touch-manipulation">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('Udhar Tracking')}
                  </div>
                  <div className="px-4 py-2 sm:px-5 sm:py-2.5 glass-card rounded-full text-sm sm:text-base text-indigo-600 font-medium flex items-center gap-2 touch-manipulation">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('Auto Reminders')}
                  </div>
                </div>

                {/* CTA Buttons - Mobile Stack */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => navigate('/register')}
                    className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-medium text-base md:text-lg active:scale-95 transition-transform duration-150 flex items-center justify-center gap-3 shadow-xl touch-manipulation min-h-[56px]"
                  >
                    <span>{t('Get Started Free')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="cursor-pointer w-full sm:w-auto px-8 py-4 glass-card text-gray-900 rounded-2xl font-medium text-base md:text-lg active:scale-95 transition-transform duration-150 touch-manipulation min-h-[56px]"
                  >
                    {t('Book Demo')}
                  </button>
                </div>

                {/* Trust Indicators - Mobile Responsive */}
                <div className="flex flex-col xs:flex-row items-center gap-4 xs:gap-6 justify-center lg:justify-start text-sm sm:text-base text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{t('Free Forever Plan')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{t('No Credit Card')}</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Floating Dashboard Mockup - Hide on Small Mobile */}
              <div className="order-2 relative w-full h-[350px] sm:h-[450] md:h-[550px] hidden lg:block">
                <div className="relative w-full h-full perspective-1000">
                  {/* Main Dashboard Panel */}
                  <div className="absolute inset-0 glass-card rounded-3xl p-5 transform rotate-y-[-12deg] rotate-x-[8deg] shadow-2xl flex flex-col gap-4">
                    {/* Dashboard Header */}
                    <div className="flex justify-between items-center p-5 bg-white/25 rounded-2xl">
                      <h3 className="font-medium text-gray-800 text-lg">Dashboard Overview</h3>
                      <div className="w-10 h-10 bg-indigo-600 rounded-full"></div>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/40 rounded-2xl p-4 text-center">
                        <div className="text-xl font-semibold text-indigo-600">₹0.00</div>
                        <div className="text-xs text-gray-600">Today's Sales</div>
                      </div>
                      <div className="bg-white/40 rounded-2xl p-4 text-center">
                        <div className="text-xl font-semibold text-indigo-600">₹71,000</div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                      <div className="bg-white/40 rounded-2xl p-4 text-center">
                        <div className="text-xl font-semibold text-indigo-600">2</div>
                        <div className="text-xs text-gray-600">Customers</div>
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="bg-white/30 rounded-2xl p-5 flex-1">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl opacity-70 flex items-center justify-center">
                        <BarChart3 className="w-16 h-16 text-indigo-400" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Secondary Panel */}
                  <div className="absolute top-10 right-10 w-52 h-36 glass-card rounded-2xl p-4 transform rotate-[8deg] shadow-xl">
                    <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
                    <div className="space-y-2">
                      <div className="bg-white/40 rounded-xl p-3 text-sm">Add Customer</div>
                      <div className="bg-white/40 rounded-xl p-3 text-sm">Create Bill</div>
                    </div>
                  </div>

                  {/* Decorative glowing orb */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Mobile-First 3 Cards */}
        <section className="px-4 sm:px-6 lg:px-8 mb-16 sm:mb-20 lg:mb-24 max-w-7xl mx-auto">
          <div className="w-full">
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[120px] sm:min-h-[140px] touch-manipulation">
                <h3 className="text-2xl xs:text-3xl sm:text-4xl font-semibold text-indigo-600 mb-2">10,000+</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium">{t('Active Shops')}</p>
              </div>
              <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[120px] sm:min-h-[140px] touch-manipulation">
                <h3 className="text-2xl xs:text-3xl sm:text-4xl font-semibold text-indigo-600 mb-2">₹50Cr+</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium">{t('Transactions')}</p>
              </div>
              <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[120px] sm:min-h-[140px] touch-manipulation">
                <h3 className="text-2xl xs:text-3xl sm:text-4xl font-semibold text-indigo-600 mb-2">4.9/5</h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium">{t('Rating')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Mobile Optimized */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-white max-w-full">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 mb-4 sm:mb-6">
                {t('Everything You Need')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {t('Powerful features to manage your business efficiently')}
              </p>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 sm:p-8 glass-card rounded-2xl touch-manipulation min-h-[180px] sm:min-h-[200px] transition-transform duration-200 active:scale-95"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-active:bg-indigo-100 transition-colors">
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section - Mobile Responsive */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute top-0 right-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-indigo-200/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>

            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/60 border border-white rounded-full text-indigo-600 mb-4 sm:mb-6">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">{t('Complete Business Solution')}</span>
              </div>
              <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 mb-4 sm:mb-6">
                {t('Why BakiPay?')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {t('Everything you need to manage and grow your business')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { textKey: 'Easy Udhar (Credit) Tracking', icon: CheckCircle },
                { textKey: 'Voice-Enabled Billing', icon: CheckCircle },
                { textKey: 'Automated Payment Reminders', icon: CheckCircle },
                { textKey: 'Multi-language Support', icon: CheckCircle },
                { textKey: 'Real-time Business Reports', icon: CheckCircle },
                { textKey: 'Mobile & Desktop Access', icon: CheckCircle }
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 sm:p-5 bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm touch-manipulation min-h-[60px] transition-transform duration-150 active:scale-95"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg text-gray-900 font-medium">{t(benefit.textKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Mobile Optimized */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-20 text-center relative overflow-hidden flex flex-col items-center justify-center border-t border-white/60">
            <Globe className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-indigo-600 mx-auto mb-6 sm:mb-8" />
            <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 mb-6 sm:mb-8">
              {t('Ready to Go Digital?')}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('Join thousands of shopkeepers who are growing their business with BakiPay. Start your free trial today.')}
            </p>
            <button
              onClick={() => navigate('/register')}
              className="w-full xs:w-auto px-8 sm:px-10 lg:px-12 py-4 sm:py-5 bg-indigo-600 text-white rounded-2xl font-medium text-base sm:text-lg lg:text-xl active:scale-95 transition-transform duration-150 inline-flex items-center justify-center gap-3 shadow-2xl touch-manipulation min-h-[56px] max-w-sm mx-auto"
            >
              {t('Create Free Account')}
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </section>

        {/* Footer - Mobile Responsive */}
        <footer className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            {/* Logo - Text Only */}
            <div>
              <span className="font-semibold text-gray-900 text-lg sm:text-xl">BakiPay</span>
            </div>

            <p className="text-sm sm:text-base text-gray-600 order-3 md:order-2">
              {t(`© ${new Date().getFullYear()} BakiPay. All rights reserved.`)}
            </p>

            <div className="flex gap-6 sm:gap-8 text-sm sm:text-base font-medium text-gray-600 order-2 md:order-3">
              <a href="#" className="active:text-indigo-600 transition-colors touch-manipulation">{t('Privacy')}</a>
              <a href="#" className="active:text-indigo-600 transition-colors touch-manipulation">{t('Terms')}</a>
              <a href="#" className="active:text-indigo-600 transition-colors touch-manipulation">{t('Support')}</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
