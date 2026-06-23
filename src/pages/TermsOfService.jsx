import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const TermsOfService = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
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
      <main className="pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 md:p-12 transition-colors hover:border-[#093C5D]/30">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-gray-900 mb-2">{t('Terms of Service')}</h1>
          <p className="text-gray-500 mb-8 pb-8 border-b border-gray-100">{t('Last updated')}: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-blue max-w-none text-gray-600">
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mt-8 mb-4">{t('1. Acceptance of Terms')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('By accessing and using UdharPay, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.')}
            </p>

            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mt-8 mb-4">{t('2. Provision of Services')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('You agree and acknowledge that UdharPay is entitled to modify, improve or discontinue any of its services at its sole discretion and without notice to you even if it may result in you being prevented from accessing any information contained in it.')}
            </p>

            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mt-8 mb-4">{t('3. Your Responsibilities')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('In order to use certain features of the service, you may be required to provide information about yourself. You agree that any information you give to UdharPay will always be accurate, correct and up to date. You are responsible for maintaining the confidentiality of your account details.')}
            </p>
            
            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mt-8 mb-4">{t('4. Content Copyright')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('You acknowledge and agree that all content and materials available on this site are protected by copyrights, trademarks, service marks, patents, trade secrets, or other proprietary rights and laws.')}
            </p>

            <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-gray-900 mt-8 mb-4">{t('5. Limitation of Liability')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('You understand and agree that UdharPay and any of its subsidiaries or affiliates shall in no event be liable for any direct, indirect, incidental, consequential, or exemplary damages. This shall include, but not be limited to damages for loss of profits, business interruption, business reputation or goodwill, loss of programs or information or other intangible loss.')}
            </p>
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

export default TermsOfService;
