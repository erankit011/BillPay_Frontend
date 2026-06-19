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

// Static pages
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
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
        <Route path="/" element={<Landing />} />
        
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
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="/customers" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Customers />} />
        </Route>

        <Route path="/bills" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Bills />} />
        </Route>

        <Route path="/products" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Products />} />
        </Route>

        <Route path="/reminders" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Reminders />} />
        </Route>

        <Route path="/voice" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<VoiceBilling />} />
        </Route>

        <Route path="/reports" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Reports />} />
        </Route>

        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Settings />} />
        </Route>

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Profile />} />
        </Route>

        <Route path="/notifications" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Notifications />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
