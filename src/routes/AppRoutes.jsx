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
const NotFound = lazy(() => import('../pages/NotFound'));

// Static pages
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPage'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const ContactSupport = lazy(() => import('../pages/ContactSupport'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
      </div>
    }>
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

        {/* Protected Dashboard Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/voice" element={<VoiceBilling />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
