import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Mic,
  BarChart2,
  Settings,
  Bell,
  Box,
  User,
  AlertCircle,
  Gem,
  Activity,
  Store,
  CreditCard,
  Megaphone,
  LifeBuoy,
  Tag,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../../redux/slices/authSlice';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import QuickSearchModal from '../../features/search';
import TopAnnouncementBar from './TopAnnouncementBar';
import SuspendedAccountModal from '../common/SuspendedAccountModal';
import Sidebar from './Sidebar';
import Header from './Header';
import LogoutConfirmModal from './LogoutConfirmModal';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { ROLES } from '../../constants/roles';

/**
 * Root Application Layout Shell
 * Coordinates responsive rails, sticky navigation, real-time WebSockets, and modal views.
 */
const MainLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === ROLES.ADMIN;

  // Desktop rail collapsible state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('app_sidebar_collapsed') === 'true';
  });

  // Mobile / Tablet offcanvas drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Floating menus & modals
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [suspensionData, setSuspensionData] = useState({ isOpen: false, reason: '' });

  // Notifications state
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const BASE_URL = useMemo(() => API_URL.replace('/api/v1', ''), [API_URL]);

  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profileImage]);

  const hasProfileImage = useMemo(() => {
    return Boolean(user?.profileImage && user.profileImage !== 'no-photo.jpg');
  }, [user?.profileImage]);

  const getImageUrl = useCallback(
    (imagePath) => {
      if (!imagePath) return null;
      if (imagePath.startsWith('http')) return imagePath;
      return `${BASE_URL}${imagePath}`;
    },
    [BASE_URL]
  );

  // Toggle sidebar collapse
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('app_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Keyboard shortcut listener (Ctrl+B / Cmd+B for sidebar, Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationOpen(false);
        setSearchModalOpen(false);
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapse]);

  // Close floating menus on click outside
  useEffect(() => {
    if (!profileDropdownOpen && !notificationOpen) return;

    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen, notificationOpen]);

  // Lock body and html scroll only when modal or drawer is open
  useEffect(() => {
    if (mobileDrawerOpen || logoutModalOpen || searchModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileDrawerOpen, logoutModalOpen, searchModalOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setProfileDropdownOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  // Real-time notifications count & WebSockets
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get('/notifications/unread-count');
        if (isMounted) {
          const count = res.data?.data?.count || res.data?.count || 0;
          setNotificationCount(count);
        }
      } catch (error) {
        if (isMounted) setNotificationCount(0);
      }
    };

    fetchNotifications();

    let socket;
    if (user?._id) {
      try {
        socket = io(BASE_URL, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
          if (user?._id) {
            socket.emit('join_shop', user._id);
          }
        });

        // 1. Force logout triggered by admin
        socket.on('force_logout', (data) => {
          toast.error(
            data?.message ||
              t('This session has been terminated by the administrator. Please log in again.'),
            {
              id: 'admin-force-logout',
              duration: 6000,
            }
          );
          dispatch(logout());
          localStorage.removeItem('isLoggedIn');
          if (socket) socket.disconnect();
          window.location.href = '/login?session_expired=true';
        });

        // 2. Account suspended by admin in real-time
        socket.on('account_suspended', (data) => {
          setSuspensionData({
            isOpen: true,
            reason: data?.reason || data?.message || '',
          });
        });

        // 3. Account reactivated by admin
        socket.on('account_reactivated', (data) => {
          setSuspensionData({ isOpen: false, reason: '' });
          toast.success(
            data?.message || t('Your shop account has been reactivated! Welcome back.'),
            {
              duration: 5000,
            }
          );
        });

        // 4. Subscription plan overridden by admin
        socket.on('plan_updated', async (data) => {
          try {
            const res = await api.get('/auth/me');
            if (res.data?.data) {
              dispatch(setUser(res.data.data));
            }
          } catch (e) {
            if (data?.plan) {
              dispatch(
                setUser({
                  ...user,
                  subscriptionPlan: data.plan,
                  subscriptionStatus: data.status || user?.subscriptionStatus,
                  currentPeriodEnd: data.currentPeriodEnd || user?.currentPeriodEnd,
                })
              );
            }
          }
          queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
          queryClient.invalidateQueries({ queryKey: ['bills'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['myInvoices'] });
          toast.success(data?.message || t('Your subscription plan has been updated!'), {
            duration: 5000,
          });
        });

        // 5. Normal new notification
        socket.on('new_notification', (newNotif) => {
          if (!isMounted) return;
          setNotificationCount((prev) => prev + 1);
          setNotifications((prev) => [{ ...newNotif, read: false }, ...prev.slice(0, 4)]);
          queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
          toast(newNotif.title + ': ' + newNotif.message, {
            duration: 4000,
          });
        });

        // 5.1 Direct official notice sent to store
        socket.on('admin_direct_notice', () => {
          queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        // 6. Broadcasts created/updated/deleted by admin in real time
        socket.on('broadcasts_updated', () => {
          queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
        });

        // 7. Platform settings or maintenance mode changed in real time
        socket.on('platform_settings_updated', (data) => {
          queryClient.invalidateQueries({ queryKey: ['activeBroadcasts'] });
          queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
          queryClient.invalidateQueries({ queryKey: ['supportContactInfo'] });
          queryClient.invalidateQueries({ queryKey: ['publicContactInfo'] });
          if (data?.isMaintenanceMode) {
            toast(
              data.maintenanceMessage ||
                t('Platform is currently undergoing scheduled maintenance.'),
              {
                duration: 6000,
              }
            );
          }
        });

        // 8. Dynamic SaaS Plans & Pricing updated by admin
        socket.on('plans_updated', () => {
          queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
          queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
        });

        // 8.1 SaaS Coupons updated or redeemed
        socket.on('coupons_updated', () => {
          queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
          queryClient.invalidateQueries({ queryKey: ['adminCouponStats'] });
        });

        // 9. When a merchant upgrades their subscription (Admin view live sync)
        socket.on('shop_subscription_upgraded', (data) => {
          if (user?.role === 'admin' || user?.role === ROLES.ADMIN) {
            queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['adminShops'] });
            toast.success(`Store upgraded: ${data.shopName || 'Shop'} (${data.plan})`, {
              duration: 5000,
            });
          }
        });

        // 10. When a new support ticket is submitted (Admin view live sync)
        socket.on('new_support_ticket', (ticket) => {
          if (user?.role === 'admin' || user?.role === ROLES.ADMIN) {
            queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
            queryClient.invalidateQueries({ queryKey: ['adminTicketStats'] });
            toast(`New support ticket #${ticket.ticketId}: ${ticket.subject || 'Inquiry'}`, {
              duration: 5000,
            });
          }
        });

        // 11. Real-time WhatsApp Gateway status update (Admin view live sync)
        socket.on('whatsapp_status', (data) => {
          if (user?.role === 'admin' || user?.role === ROLES.ADMIN) {
            queryClient.setQueryData(['whatsappStatus'], data);
            queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
            if (data?.status === 'CONNECTED') {
              toast.success(t('WhatsApp Gateway connected successfully!'), {
                id: 'wa-connected-success',
                duration: 4000,
              });
            }
          }
        });
      } catch (err) {
        // Fallback
      }
    }

    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [user?._id, BASE_URL, dispatch, queryClient, t]);

  const fetchNotificationList = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await api.get('/notifications?limit=5');
      const notificationsData = res.data?.data?.data || [];
      setNotifications(
        notificationsData.map((notif) => ({
          ...notif,
          read: notif.isRead,
        }))
      );
    } catch (error) {
      setNotifications([]);
    }
  }, [user?._id]);

  const handleNotificationClick = useCallback(() => {
    setNotificationOpen((prev) => {
      const next = !prev;
      if (next) fetchNotificationList();
      return next;
    });
  }, [fetchNotificationList]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await api.patch(`/notifications/${notificationId}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setNotificationCount((prev) => Math.max(0, prev - 1));
        queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
      } catch (error) {
        console.error(error);
      }
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setNotificationCount(0);
      queryClient.invalidateQueries({ queryKey: ['directOfficialNotices'] });
    } catch (error) {
      console.error(error);
    }
  }, [queryClient]);

  const executeLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      dispatch(logout());
      toast.success(t('Logged out successfully'));
      setLogoutModalOpen(false);
      window.location.href = '/login';
    }
  }, [dispatch, t]);

  const handleSuspendedLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    dispatch(logout());
    setSuspensionData({ isOpen: false, reason: '' });
    const reasonParam = suspensionData.reason
      ? `&reason=${encodeURIComponent(suspensionData.reason)}`
      : '';
    window.location.href = `/login?suspended=true${reasonParam}`;
  }, [dispatch, suspensionData.reason]);

  // Dynamic breadcrumb label
  const breadcrumbTitle = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard') || p === '/admin') return 'Dashboard';
    if (p.includes('/admin/shops')) return 'Store';
    if (p.includes('/admin/bills')) return 'Store Bill';
    if (p.includes('/admin/subscriptions')) return 'Billing Receipts';
    if (p.includes('/admin/reports')) return 'Store Reports';
    if (p.includes('/admin/health')) return 'System Health';
    if (p.includes('/admin/settings')) return 'Platform Settings';
    if (p.includes('/admin/broadcasts')) return 'Broadcasts';
    if (p.includes('/admin/support')) return 'Support Desk';
    if (p.includes('/admin/coupons')) return 'Coupons';
    if (p.includes('/admin/plans')) return 'Plan Limits & Pricing';
    if (p.includes('/admin/audit-logs')) return 'Audit Logs';
    if (p.includes('/dashboard')) return 'Dashboard';
    if (p.includes('/customers')) return 'Customers';
    if (p.includes('/products')) return 'Products';
    if (p.includes('/bills')) return 'Billing';
    if (p.includes('/reminders')) return 'Reminders';
    if (p.includes('/voice')) return 'Voice Entry';
    if (p.includes('/reports')) return 'Reports';
    if (p.includes('/subscription')) return 'Subscription';
    if (p.includes('/profile')) return 'Account';
    if (p.includes('/settings')) return 'Settings';
    if (p.includes('/notifications')) return 'Notifications';
    return 'Dashboard';
  }, [location.pathname]);

  // Dynamic breadcrumb icon matching the current active page
  const BreadcrumbIcon = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard') || p === '/admin') return Home;
    if (p.includes('/admin/shops')) return Store;
    if (p.includes('/admin/bills')) return FileText;
    if (p.includes('/admin/subscriptions')) return CreditCard;
    if (p.includes('/admin/reports')) return BarChart2;
    if (p.includes('/admin/health')) return Activity;
    if (p.includes('/admin/broadcasts')) return Megaphone;
    if (p.includes('/admin/support')) return LifeBuoy;
    if (p.includes('/admin/coupons')) return Tag;
    if (p.includes('/admin/plans')) return Layers;
    if (p.includes('/admin/audit-logs')) return ShieldCheck;
    if (p.includes('/dashboard')) return Home;
    if (p.includes('/customers')) return Users;
    if (p.includes('/products')) return Box;
    if (p.includes('/bills')) return FileText;
    if (p.includes('/reminders')) return Bell;
    if (p.includes('/voice')) return Mic;
    if (p.includes('/reports')) return BarChart2;
    if (p.includes('/subscription')) return Gem;
    if (p.includes('/profile')) return User;
    if (p.includes('/settings')) return Settings;
    if (p.includes('/notifications')) return Bell;
    return Home;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col">
      {/* Top Announcement Bar (Broadcasts & Maintenance Alert) */}
      <TopAnnouncementBar />

      <div className="flex-1 flex min-w-0 relative">
        {/* Desktop Sidebar & Mobile Offcanvas Drawer */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
          isAdmin={isAdmin}
        />

        {/* Main Column (Sticky Navbar + Page Content) */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
          }`}
        >
          {/* Header Bar */}
          <Header
            toggleSidebarCollapse={toggleSidebarCollapse}
            setMobileDrawerOpen={setMobileDrawerOpen}
            BreadcrumbIcon={BreadcrumbIcon}
            breadcrumbTitle={breadcrumbTitle}
            onOpenSearch={() => setSearchModalOpen(true)}
            onOpenLogout={() => setLogoutModalOpen(true)}
            user={user}
            isAdmin={isAdmin}
            hasProfileImage={hasProfileImage}
            profileImageError={profileImageError}
            setProfileImageError={setProfileImageError}
            getImageUrl={getImageUrl}
            profileDropdownOpen={profileDropdownOpen}
            setProfileDropdownOpen={setProfileDropdownOpen}
            profileMenuRef={profileMenuRef}
            notificationCount={notificationCount}
            notifications={notifications}
            notificationOpen={notificationOpen}
            onNotificationClick={handleNotificationClick}
            onCloseNotifications={() => setNotificationOpen(false)}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            notificationMenuRef={notificationMenuRef}
          />

          {/* Primary Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
            {user?.subscriptionStatus === 'past_due' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900">
                      {t('Payment Action Required')}
                    </h4>
                    <p className="text-sm font-medium text-red-800/90 mt-0.5 leading-snug">
                      {t(
                        'Your recent payment could not be processed. Please check your bank or payment method to avoid service interruption.'
                      )}
                    </p>
                  </div>
                </div>
                <Link
                  to="/subscription"
                  className="w-full sm:w-auto inline-flex justify-center items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 px-5 py-2.5 rounded-lg transition-all shrink-0"
                >
                  {t('Resolve Now')}
                </Link>
              </div>
            )}

            {/* Shopkeeper Business Setup Incomplete Alert Banner */}
            {user?.role === ROLES.SHOPKEEPER && !user?.isBusinessSetupCompleted && (
              <div className="w-full bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 sm:p-4 mb-6 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 transition-all">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-blue-200 text-[#093C5D] flex items-center justify-center shrink-0 shadow-none">
                    <Store className="w-4 h-4 sm:w-5 sm:h-5 text-[#093C5D]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight leading-snug">
                      {t('Set Up Your Business Profile')}
                    </h4>
                    <p className="text-xs sm:text-[13px] font-medium text-gray-600 leading-normal mt-0.5">
                      {t('Add your shop name, address & phone to create bills and send invoices.')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center shrink-0 w-full md:w-auto">
                  <Link
                    to="/setup-business"
                    className="cursor-pointer w-full md:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#093C5D] hover:bg-[#082a42] active:scale-95 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all shadow-none"
                  >
                    <span>{t('Complete Setup')}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            )}

            <Outlet />
          </main>
        </div>
      </div>

      {/* Quick Search Command Palette (Ctrl+K) */}
      <QuickSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={executeLogout}
      />

      {/* Suspended Account Real-Time Modal */}
      <SuspendedAccountModal
        isOpen={suspensionData.isOpen}
        reason={suspensionData.reason}
        onLogout={handleSuspendedLogout}
      />
    </div>
  );
};

export default React.memo(MainLayout);
