import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }
  

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo - Text Only */}
        {/* <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
            BakiPay
          </h1>
          <p className="text-sm text-gray-600">
            {t('Smart Billing & Udhar Management')}
          </p>
        </div> */}

        {/* Auth Form Container */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <Outlet />
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} BakiPay. {t('All rights reserved')}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
