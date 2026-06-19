import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const PrivacyPolicy = () => {
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
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] md:w-[7px] md:h-[7px] rounded-full bg-[#2ECC71] ml-[1px] mb-[2px] align-baseline"></span></span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('Privacy Policy')}</h1>
          <p className="text-gray-500 mb-8 pb-8 border-b border-gray-100">{t('Last updated')}: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-blue max-w-none text-gray-600">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">{t('1. Information We Collect')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.')}
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">{t('2. How We Use Your Information')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('We may use the information we collect about you to:')}
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>{t('Provide, maintain, and improve our Services;')}</li>
              <li>{t('Perform internal operations, including to prevent fraud and abuse of our Services;')}</li>
              <li>{t('Send or facilitate communications (i) between you and a Delivery Partner or (ii) between you and a contact of yours at your direction in connection with your use of certain features;')}</li>
              <li>{t('Send you communications we think will be of interest to you, including information about products, services, promotions, news, and events of UdharPay and other companies, where permissible and according to local applicable laws;')}</li>
              <li>{t('Personalize and improve the Services, including to provide or recommend features, content, social connections, referrals, and advertisements.')}</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">{t('3. Sharing of Information')}</h2>
            <p className="mb-4 leading-relaxed">
              {t('We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:')}
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>{t('With Delivery Partners to enable them to provide the Services you request. For example, we share your name, photo (if you provide one), average User rating given by Delivery Partners, and pickup and/or drop-off locations with Delivery Partners;')}</li>
              <li>{t('With third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us;')}</li>
              <li>{t('With the general public if you submit content in a public forum, such as blog comments, social media posts, or other features of our Services that are viewable by the general public;')}</li>
              <li>{t('With third parties with whom you choose to let us share information, for example other apps or websites that integrate with our API or Services, or those with an API or Service with which we integrate.')}</li>
            </ul>

             <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-8 mb-4">{t('4. Security')}</h2>
            <p className="mb-4 leading-relaxed">
               {t('We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.')}
            </p>
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

export default PrivacyPolicy;
