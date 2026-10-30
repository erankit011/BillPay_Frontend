/**
 * Application Routing Architecture
 * Declares lazy-loaded route chunks, role-based route guards (RBAC),
 * public auth redirects, and suspense loading fallbacks.
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

/**
 * Lazy Loaded Page Modules for Code Splitting
 */
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const VerifyOTP = lazy(() => import('../pages/VerifyOTP'));
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

/**
 * Dedicated Admin Feature Pages
 */
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminShops = lazy(() => import('../pages/admin/AdminShops'));
const AdminBills = lazy(() => import('../pages/admin/AdminBills'));
const AdminSubscriptions = lazy(() => import('../pages/admin/AdminSubscriptions'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminSystemHealth = lazy(() => import('../pages/admin/AdminSystemHealth'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminBroadcasts = lazy(() => import('../pages/admin/AdminBroadcasts'));
const AdminSupport = lazy(() => import('../pages/admin/AdminSupport'));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'));
const AdminAuditLogs = lazy(() => import('../pages/admin/AdminAuditLogs'));
const AdminPlans = lazy(() => import('../pages/admin/AdminPlans'));

/**
 * Public Legal & Information Pages
 */
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPage'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const ContactSupport = lazy(() => import('../pages/ContactSupport'));

import SwirlingLoader from '../components/common/SwirlingLoader';

/**
 * Onboarding & OAuth Callbacks
 */
const BusinessSetup = lazy(() => import('../pages/BusinessSetup'));
const OAuthCallback = lazy(() => import('../pages/OAuthCallback'));

import { ROLES } from '../constants/roles';

/**
 * Role-Based Protected Route Guard (RBAC)
 * Enforces session authentication and validates user role permissions with case-insensitive normalization
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = (user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

    if (!normalizedAllowed.includes(currentRole)) {
      return <Navigate to={currentRole === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
    }
  }

  return children;
};

/**
 * Onboarding Access Wrapper
 * Grants merchants immediate workspace exploration while contextual alerts prompt business setup
 */
const OnboardingRoute = ({ children }) => {
  return children;
};

/**
 * Public Route Guard
 * Redirects authenticated sessions directly to their corresponding role dashboard
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const currentRole = (user.role || '').toLowerCase();
    return <Navigate to={currentRole === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

/**
 * Dynamic Settings Router
 * Routes merchants to shop settings and administrators to platform settings
 */
const SettingsRoute = () => {
  const { user } = useSelector((state) => state.auth);
  const currentRole = (user?.role || '').toLowerCase();
  if (currentRole === 'admin') {
    return <Navigate to="/admin/settings" replace />;
  }
  return <Settings />;
};

/**
 * Root Application Route Tree Definition
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SwirlingLoader className="w-12 h-12 text-[#093C5D]" />
      </div>
    }>
      <Routes>
        {/**
         * Landing Page Route
         * Public landing presentation showcasing platform features and pricing
         */}
        <Route path="/" element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } />
        
        {/**
         * Static Information Routes
         * Public access legal guidelines, terms of service, and support channels
         */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/support" element={<Navigate to="/contact-support" replace />} />

        {/**
         * Authentication Access Routes
         * Sign-in and account registration flows with redirect guards for active sessions
         */}
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

        {/**
         * One-Time Password Verification Routes
         * Multi-factor verification endpoints for account signup and step-up auth
         */}
        <Route element={<AuthLayout />}>
          <Route path="/verify-email" element={<VerifyOTP type="registration" />} />
          <Route path="/verify-login-otp" element={<VerifyOTP type="login" />} />
        </Route>

        {/**
         * Credential Recovery Routes
         * Password reset token request and validation workflow
         */}
        <Route element={<AuthLayout />}>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        </Route>

        {/**
         * Single Sign-On Callback Route
         * Processes third-party OAuth redirect exchanges
         */}
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/**
         * Protected Administration Routes
         * Administrative controls scoped strictly to super-admin privileges
         */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/shops" element={<AdminShops />} />
          <Route path="/admin/bills" element={<AdminBills />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/subscriptions/store-plans" element={<Navigate to="/admin/shops" replace />} />
          <Route path="/admin/subscriptions/plans" element={<Navigate to="/admin/plans" replace />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/health" element={<AdminSystemHealth />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/**
         * Common Authenticated Routes
         * User profile settings and notification history shared across roles
         */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.SHOPKEEPER, ROLES.ADMIN]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/**
         * Merchant Dashboard Routes
         * Core commerce operations for inventory, billing, customers, and reports
         */}
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

        {/**
         * Standalone Protected Views
         * Printing views and full-page customer receipts bypassing sidebar chrome
         */}
        <Route path="/platform-receipt/:id" element={
          <ProtectedRoute allowedRoles={[ROLES.SHOPKEEPER, ROLES.ADMIN]}>
            <PlatformReceipt />
          </ProtectedRoute>
        } />

        {/**
         * Merchant Onboarding Wizard
         * First-time business registration and profile setup screen
         */}
        <Route path="/setup-business" element={
          <ProtectedRoute allowedRoles={[ROLES.SHOPKEEPER]}>
            <BusinessSetup />
          </ProtectedRoute>
        } />

        {/**
         * Public Shareable Invoices
         * Client-facing digital invoice preview without authentication requirement
         */}
        <Route path="/invoice/public/:id" element={<PublicInvoice />} />

        {/**
         * Fallback Not-Found Handler
         * 404 destination for unregistered URL paths
         */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
