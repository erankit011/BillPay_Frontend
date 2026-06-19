import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Receipt,
  Shield,
  Zap,
  BarChart3,
  Clock,
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Users,
      titleKey: 'Customer Management',
      descriptionKey: 'Track customers, credit history, and payment patterns easily',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart3,
      titleKey: 'Business Insights',
      descriptionKey: 'Real-time analytics and reports to grow your business',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: Shield,
      titleKey: 'Secure & Reliable',
      descriptionKey: 'Bank-grade security with 99.9% uptime guarantee',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Zap,
      titleKey: 'Voice Billing',
      descriptionKey: 'Create bills using voice commands in your language',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Clock,
      titleKey: 'Auto Reminders',
      descriptionKey: 'Automated payment reminders via SMS and WhatsApp',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 safe-top">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-[22px] sm:text-[24px] md:text-[28px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] md:w-2 md:h-2 rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
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
      <main className="pt-20 sm:pt-24 pb-10 sm:pb-16 flex flex-col gap-10 sm:gap-20">
        
        {/* HERO SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#093C5D]/5 border border-[#093C5D]/10 text-[#093C5D] text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#093C5D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#093C5D]"></span>
              </span>
              {t('Smart Choice for Indian Retailers')}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight leading-tight sm:leading-tight md:leading-tight lg:leading-tight mb-5 sm:mb-6">
              <span className="block sm:inline">{t("Your Shop's")}</span>{' '}
              <span className="text-[#093C5D] block sm:inline">{t("Digital Partner")}</span>
            </h1>
            
            <p className="text-sm sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
              {t('Complete billing, udhar tracking, and easy business analytics. Built for modern Indian shopkeepers to scale effortlessly.')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto mx-auto px-4 sm:px-0">
              <button
                onClick={() => navigate('/register')}
                className="cursor-pointer w-full sm:w-auto min-w-[200px] h-12 sm:h-14 bg-[#093C5D] text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-[#072C44] transition-all flex items-center justify-center"
              >
                {t('Get started free')}
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 font-medium flex items-center justify-center gap-1.5 flex-wrap">
              {t('Trusted by 10,000+ Shopkeepers')} <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-gray-300 mx-1"></span><span className="sm:hidden w-full h-0"></span> {t('No credit card required')}
            </p>
          </div>

          {/* Hero Image/Mockup Block */}
          <div className="mt-16 sm:mt-24 w-full max-w-5xl mx-auto text-center px-4 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              {t('A dashboard designed for simplicity')}
            </h2>
            <p className="text-sm sm:text-medium text-gray-500 mb-10 sm:mb-12 max-w-xl mx-auto">
              {t('Get a complete overview of your sales, outstanding balances, and recent activities without the clutter. Visualizing your business has never been this easy.')}
            </p>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-10 mb-[-1px] sm:mb-0 relative overflow-hidden ring-1 ring-gray-900/5">
              
              {/* Background ambient glow inside the container */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-50 blur-3xl opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-50 blur-3xl opacity-50 pointer-events-none"></div>

              {/* Mac-style Window Header */}
              <div className="relative z-10 flex items-center gap-2 mb-6 sm:mb-8 border-b border-gray-100 pb-4">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                <div className="ml-3 sm:ml-4 h-6 w-32 sm:w-48 bg-gray-50/80 rounded border border-gray-100"></div>
              </div>

              {/* Layout Wrapper */}
              <div className="relative z-10 flex gap-6 sm:gap-8 pt-2">
                {/* Abstract Sidebar */}
                <div className="hidden sm:flex flex-col gap-6 w-40 shrink-0 border-r border-gray-50 pr-6">
                  {/* Logo Skeleton */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-md bg-[#093C5D]/20"></div>
                    <div className="h-5 w-20 bg-gray-100 rounded-md"></div>
                  </div>
                  
                  {/* Nav Items Skeletons */}
                  <div className="flex flex-col gap-4">
                    <div className="h-6 w-full bg-[#093C5D]/10 rounded border border-[#093C5D]/20"></div>
                    <div className="h-5 w-4/5 bg-gray-50 rounded border border-gray-100"></div>
                    <div className="h-5 w-3/4 bg-gray-50 rounded border border-gray-100"></div>
                    <div className="h-5 w-5/6 bg-gray-50 rounded border border-gray-100"></div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  {/* Top Bar Skeleton */}
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
                     <div className="h-7 w-48 sm:w-64 bg-gray-100 rounded-md border border-gray-50"></div>
                     <div className="h-9 w-9 bg-gray-100 rounded-full hidden sm:block border border-gray-200/60"></div>
                  </div>

                  {/* Cards Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                    <div className="rounded-xl p-5 text-left border border-green-100/50 bg-green-50/30 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span className="h-2.5 w-16 bg-gray-200/80 rounded-full"></span>
                      </div>
                      <div className="h-7 w-24 bg-gray-300/80 rounded-md mb-2"></div>
                      <div className="h-2 w-32 bg-gray-200/60 rounded-full"></div>
                    </div>
                    
                    <div className="rounded-xl p-5 text-left border border-orange-100/50 bg-orange-50/30 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                        <span className="h-2.5 w-16 bg-gray-200/80 rounded-full"></span>
                      </div>
                      <div className="h-7 w-20 bg-gray-300/80 rounded-md mb-2"></div>
                      <div className="h-2 w-28 bg-gray-200/60 rounded-full"></div>
                    </div>

                    <div className="rounded-xl p-5 text-left border border-[#093C5D]/10 bg-[#093C5D]/[0.03] backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#093C5D]"></div>
                        <span className="h-2.5 w-16 bg-gray-200/80 rounded-full"></span>
                      </div>
                      <div className="h-7 w-28 bg-gray-300/80 rounded-md mb-2"></div>
                      <div className="h-2 w-36 bg-gray-200/60 rounded-full"></div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="relative h-48 sm:h-56 w-full border border-gray-100 rounded-xl bg-gray-50/30 flex items-end justify-between gap-3 sm:gap-6 px-4 pt-4 overflow-hidden">
                    {/* Chart Header */}
                    <div className="absolute top-4 left-5 right-5 flex justify-between items-center text-xs">
                        <div className="h-3 w-28 bg-gray-200/80 rounded-full"></div>
                        <div className="h-3 w-16 bg-gray-200/80 rounded-full"></div>
                    </div>

                    {/* Grid lines */}
                    <div className="absolute inset-x-0 bottom-1/3 border-b border-gray-200/60 border-dashed"></div>
                    <div className="absolute inset-x-0 bottom-2/3 border-b border-gray-200/60 border-dashed"></div>
                    
                    {/* Abstract Bars */}
                    {[
                      { h1: 30, h2: 15 },
                      { h1: 45, h2: 10 },
                      { h1: 35, h2: 20 },
                      { h1: 60, h2: 15 },
                      { h1: 50, h2: 25 },
                      { h1: 75, h2: 15 },
                      { h1: 55, h2: 20 }
                    ].map((data, i) => (
                      <div key={i} className="relative flex-1 flex flex-col justify-end items-center h-full z-10 w-full group">
                        {/* Upper portion */}
                        <div className="w-full max-w-[24px] sm:max-w-[40px] bg-orange-200/80 rounded-t-md transition-all duration-300 group-hover:bg-orange-300" style={{ height: `${data.h2}%` }}></div>
                        {/* Lower portion */}
                        <div className="w-full max-w-[24px] sm:max-w-[40px] bg-gray-200/90 rounded-b-md transition-all duration-300 group-hover:bg-gray-300" style={{ height: `${data.h1 - data.h2}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="bg-[#F5F5F5] rounded-2xl sm:rounded-3xl py-12 sm:py-16 px-4 sm:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2 sm:mb-3">
                {t('Everything you need to grow')}
              </h2>
              <p className="text-base text-gray-600 max-w-xl mx-auto">
                {t('All the powerful tools packed into one simple interface.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 transition-colors hover:border-[#093C5D]/30"
                >
                  <div className={`w-10 h-10 ${feature.bgColor} rounded-md flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center max-w-4xl mx-auto border-y border-gray-200 sm:border sm:border-gray-200 bg-white sm:rounded-2xl py-8 sm:py-10">
            <div className="p-2 sm:p-4">
              <h3 className="text-3xl sm:text-4xl font-bold text-[#093C5D] mb-1">10K+</h3>
              <p className="text-sm text-gray-600 font-medium">{t('Active Shops')}</p>
            </div>
            <div className="p-2 sm:p-4 border-t sm:border-t-0 sm:border-l border-gray-200 pt-6 sm:pt-4">
              <h3 className="text-3xl sm:text-4xl font-bold text-[#093C5D] mb-1">₹50Cr</h3>
              <p className="text-sm text-gray-600 font-medium">{t('Transactions')}</p>
            </div>
            <div className="p-2 sm:p-4 border-t sm:border-t-0 sm:border-l border-gray-200 pt-6 sm:pt-4">
              <h3 className="text-3xl sm:text-4xl font-bold text-[#093C5D] mb-1">4.9</h3>
              <p className="text-sm text-gray-600 font-medium">{t('Store Rating')}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="bg-[#093C5D] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 sm:mb-4">
              {t('Ready to digitize your shop?')}
            </h2>
            <p className="text-sm sm:text-base text-[#F5F5F5] opacity-90 mb-8 sm:mb-10 max-w-xl">
              {t('Join thousands of shopkeepers growing their business with UdharPay today.')}
            </p>
            <button
              onClick={() => navigate('/register')}
              className="cursor-pointer w-full sm:w-auto min-w-[200px] h-12 flex items-center justify-center bg-white text-[#093C5D] rounded-md font-semibold text-base hover:bg-gray-100 transition-colors"
            >
              {t('Create free account')}
            </button>
          </div>
        </section>
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

export default Landing;

