import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Lazy load pages for code splitting
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyOTP = lazy(() => import('../components/auth/VerifyOTP'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Customers = lazy(() => import('../pages/Customers'));
const Bills = lazy(() => import('../pages/Bills'));
const VoiceBilling = lazy(() => import('../pages/VoiceBilling'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));
const Products = lazy(() => import('../pages/Products'));
const Reminders = lazy(() => import('../pages/Reminders'));
const Profile = lazy(() => import('../pages/Profile'));
const Notifications = lazy(() => import('../pages/Notifications'));
const Subscription = lazy(() => import('../pages/Subscription'));
const PlatformReceipt = lazy(() => import('../pages/PlatformReceipt'));
const PublicInvoice = lazy(() => import('../pages/PublicInvoice'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Admin Feature Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminShops = lazy(() => import('../pages/admin/AdminShops'));
const AdminBills = lazy(() => import('../pages/admin/AdminBills'));
const AdminSubscriptions = lazy(() => import('../pages/admin/AdminSubscriptions'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminSystemHealth = lazy(() => import('../pages/admin/AdminSystemHealth'));

// Static pages
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPage'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const ContactSupport = lazy(() => import('../pages/ContactSupport'));

import SwirlingLoader from '../components/common/SwirlingLoader';

// Onboarding
const BusinessSetup = lazy(() => import('../pages/BusinessSetup'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));

import { ROLES } from '../constants/roles';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = user?.role || ROLES.SHOPKEEPER;
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to={currentRole === ROLES.ADMIN ? '/admin/dashboard' : '/dashboard'} replace />;
    }
  }

  return children;
};

const OnboardingRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Only shopkeepers need business setup; admins manage platform
  if (user?.role === ROLES.SHOPKEEPER && !user.isBusinessSetupCompleted) {
    return <Navigate to="/setup-business" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === ROLES.ADMIN ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"></div>}>
      <Routes>
        {/* Landing Page - Public */}
        <Route path="/" element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } />
        
        {/* Static Pages - Public */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact-support" element={<ContactSupport />} />

        {/* Auth Routes - Redirect to dashboard if already logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }>
          <Route index element={<Login />} />
        </Route>

        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }>
          <Route index element={<Register />} />
        </Route>

        {/* OTP Verification Routes - No redirect, can be accessed anytime */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-email" element={<VerifyOTP type="registration" />} />
          <Route path="/verify-login-otp" element={<VerifyOTP type="login" />} />
        </Route>

        {/* Password Reset Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        </Route>

        {/* OAuth Callback Route */}
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Protected Admin Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/shops" element={<AdminShops />} />
          <Route path="/admin/bills" element={<AdminBills />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/health" element={<AdminSystemHealth />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Protected Common / Profile Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.SHOPKEEPER, ROLES.ADMIN]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Protected Shopkeeper Dashboard Routes */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.SHOPKEEPER]}>
            <OnboardingRoute>
              <MainLayout />
            </OnboardingRoute>
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/voice" element={<VoiceBilling />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>

        {/* Protected Standalone Routes (No MainLayout for Print/Full page) */}
        <Route path="/platform-receipt/:id" element={
          <ProtectedRoute>
            <PlatformReceipt />
          </ProtectedRoute>
        } />

        {/* Onboarding Route (Protected but not behind OnboardingRoute) */}
        <Route path="/setup-business" element={
          <ProtectedRoute>
            <BusinessSetup />
          </ProtectedRoute>
        } />

        {/* Public Routes */}
        <Route path="/invoice/public/:id" element={<PublicInvoice />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
