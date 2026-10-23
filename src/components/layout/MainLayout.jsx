import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Mic,
  BarChart2,
  Settings,
  Bell,
  Box,
  HelpCircle,
  LogOut,
  User,
  AlertCircle,
  Gem,
  Activity,
  Store,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Search,
  ArrowRight,
  Megaphone,
  LifeBuoy,
  Tag,
  ShieldCheck,
  Layers,
  Crown
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../../redux/slices/authSlice';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import LanguageSwitcher from '../LanguageSwitcher';
import QuickSearchModal from '../../features/search';
import TopAnnouncementBar from './TopAnnouncementBar';
import SuspendedAccountModal from '../common/SuspendedAccountModal';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { ROLES } from '../../constants/roles';

// HeroUI-style Sidebar Trigger Icon (Rectangle with left rail bar)
const SidebarRailIcon = ({ className = "w-4 h-4", strokeWidth = 1.75 }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="3" />
    <path d="M9 3v18" />
  </svg>
);

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const isAdmin = user?.role === ROLES.ADMIN;

  // Desktop rail collapsible state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('app_sidebar_collapsed') === 'true';
  });

  // Mobile / Tablet offcanvas drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Admin Accordion state for Stores
  const isStoresActive = useMemo(() => {
    return (
      location.pathname === '/admin/shops' ||
      location.pathname === '/admin/bills' ||
      location.pathname === '/admin/reports'
    );
  }, [location.pathname]);

  const [storesOpen, setStoresOpen] = useState(true);

  // Admin Accordion state for Subscriptions
  const isSubscriptionsActive = useMemo(() => {
    return (
      location.pathname === '/admin/subscriptions' ||
      location.pathname === '/admin/subscriptions/plans' ||
      location.pathname === '/admin/plans'
    );
  }, [location.pathname]);

  const [subscriptionsOpen, setSubscriptionsOpen] = useState(true);

  // Shopkeeper Accordion state for Billing (Bills, Voice, Reminders)
  const isShopkeeperBillingActive = useMemo(() => {
    return (
      location.pathname === '/bills' ||
      location.pathname === '/voice' ||
      location.pathname === '/reminders'
    );
  }, [location.pathname]);

  const [shopkeeperBillingOpen, setShopkeeperBillingOpen] = useState(true);

  // Floating menus & modals
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [suspensionData, setSuspensionData] = useState({ isOpen: false, reason: '' });
  const queryClient = useQueryClient();

  // Notifications
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

  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  }, [BASE_URL]);

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
          toast.error(data?.message || t('This session has been terminated by the administrator. Please log in again.'), {
            id: 'admin-force-logout',
            duration: 6000,
          });
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
          toast.success(data?.message || t('Your shop account has been reactivated! Welcome back.'), {
            duration: 5000,
          });
        });

        // 4. Subscription plan overridden by admin
        socket.on('plan_updated', (data) => {
          if (data?.plan) {
            dispatch(setUser({
              ...user,
              subscriptionPlan: data.plan,
              subscriptionStatus: data.status || user.subscriptionStatus,
              currentPeriodEnd: data.currentPeriodEnd || user.currentPeriodEnd,
            }));
            queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success(data.message || t('Your subscription plan has been updated!'), {
              duration: 5000,
            });
          }
        });

        // 5. Normal new notification
        socket.on('new_notification', (newNotif) => {
          if (!isMounted) return;
          setNotificationCount((prev) => prev + 1);
          setNotifications((prev) => [
            { ...newNotif, read: false },
            ...prev.slice(0, 4),
          ]);
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
            toast(data.maintenanceMessage || t('Platform is currently undergoing scheduled maintenance.'), {
              duration: 6000,
            });
          }
        });

        // 8. Dynamic SaaS Plans & Pricing updated by admin
        socket.on('plans_updated', () => {
          queryClient.invalidateQueries({ queryKey: ['publicPlans'] });
          queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
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
  }, []);

  const handleNotificationClick = useCallback(() => {
    setNotificationOpen((prev) => {
      const next = !prev;
      if (next) fetchNotificationList();
      return next;
    });
  }, [fetchNotificationList]);

  const markAsRead = useCallback(async (notificationId) => {
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
  }, [queryClient]);

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
    const reasonParam = suspensionData.reason ? `&reason=${encodeURIComponent(suspensionData.reason)}` : '';
    window.location.href = `/login?suspended=true${reasonParam}`;
  }, [dispatch, suspensionData.reason]);

  // User initials (e.g. JG)
  const userInitials = useMemo(() => {
    if (!user?.name) return isAdmin ? 'AD' : 'UP';
    const parts = user.name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name, isAdmin]);

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
      {/* =========================================================================
          TOP ANNOUNCEMENT BAR (Global Broadcasts, Notices & Maintenance Alert)
      ========================================================================= */}
      <TopAnnouncementBar />

      <div className="flex-1 flex min-w-0 relative">
        {/* =========================================================================
            DESKTOP SIDEBAR (Pinned below top announcement bar if active)
            Collapsed rail mode: w-[72px] | Expanded mode: w-64
        ========================================================================= */}
        <aside
          className={`hidden lg:flex flex-col fixed left-0 z-40 bg-white border-r border-gray-100 transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? 'w-[72px]' : 'w-64'
          }`}
          style={{ top: 'var(--top-announcement-height, 0px)', bottom: 0 }}
        >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-gray-100 shrink-0">
          <Link
            to={isAdmin ? '/admin/dashboard' : '/dashboard'}
            className={`flex items-center gap-3 transition-opacity ${
              sidebarCollapsed ? 'mx-auto justify-center' : ''
            }`}
            title="UdharPay"
          >
            <div className="w-8 h-8 rounded-lg bg-[#093C5D] text-white flex items-center justify-center font-medium text-base shadow-sm shrink-0">
              U
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-medium text-gray-900 text-[16px] tracking-tight truncate">
                  UdharPay
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-[#093C5D]/10 text-[#093C5D] shrink-0">
                    ADMIN
                  </span>
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] ml-0.5" />
                )}
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {isAdmin ? (
            /* ================= ADMIN NAVIGATION ================= */
            <>
              {/* 1. Dashboard */}
              <NavLink
                to="/admin/dashboard"
                title={sidebarCollapsed ? 'Dashboard' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Home className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </NavLink>

              {/* 2. Stores Accordion Group */}
              <div className="pt-0.5">
                {sidebarCollapsed ? (
                  <NavLink
                    to="/admin/shops"
                    title="Stores"
                    className={({ isActive }) =>
                      `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                        isStoresActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Store className="w-4 h-4 shrink-0" />
                  </NavLink>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStoresOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                        isStoresActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Store className="w-4 h-4 shrink-0" />
                        <span>Stores</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          storesOpen ? 'rotate-180' : ''
                        } ${isStoresActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                      />
                    </button>

                    {storesOpen && (
                      <div className="mt-1 space-y-1 relative pl-7 pr-1">
                        <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                        <NavLink
                          to="/admin/shops"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Store
                        </NavLink>

                        <NavLink
                          to="/admin/bills"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Store Bill
                        </NavLink>

                        <NavLink
                          to="/admin/reports"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Reports
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Subscriptions Accordion Group (with LIVE badge) */}
              <div className="pt-0.5">
                {sidebarCollapsed ? (
                  <NavLink
                    to="/admin/subscriptions"
                    title="Subscriptions"
                    className={({ isActive }) =>
                      `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                        isSubscriptionsActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                  </NavLink>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setSubscriptionsOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                        isSubscriptionsActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 shrink-0" />
                        <span>Subscriptions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          LIVE
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            subscriptionsOpen ? 'rotate-180' : ''
                          } ${isSubscriptionsActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                        />
                      </div>
                    </button>

                    {subscriptionsOpen && (
                      <div className="mt-1 space-y-1 relative pl-7 pr-1">
                        <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                        <NavLink
                          to="/admin/subscriptions"
                          end
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Billing Receipts
                        </NavLink>


                        <NavLink
                          to="/admin/plans"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Plans & Pricing
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. System Health (with LIVE badge) */}
              <NavLink
                to="/admin/health"
                title={sidebarCollapsed ? 'System Health' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Activity className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span>System Health</span>
                    <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                      LIVE
                    </span>
                  </>
                )}
              </NavLink>

              {/* 5. Broadcasts & Announcements */}
              <NavLink
                to="/admin/broadcasts"
                title={sidebarCollapsed ? 'Broadcasts' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Broadcasts</span>}
              </NavLink>

              {/* 6. Support & Helpdesk Desk */}
              <NavLink
                to="/admin/support"
                title={sidebarCollapsed ? 'Support Desk' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <LifeBuoy className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Support Desk</span>}
              </NavLink>

              {/* 7. Coupons & Promo Codes */}
              <NavLink
                to="/admin/coupons"
                title={sidebarCollapsed ? 'Coupons' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Tag className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Coupons</span>}
              </NavLink>


              {/* 9. Platform Security & Immutable Audit Logs */}
              <NavLink
                to="/admin/audit-logs"
                title={sidebarCollapsed ? 'Audit Logs' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Audit Logs</span>}
              </NavLink>

              {/* 6. Settings */}
              <NavLink
                to="/admin/settings"
                title={sidebarCollapsed ? 'Settings' : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Settings</span>}
              </NavLink>
            </>
          ) : (
            /* ================= SHOPKEEPER NAVIGATION ================= */
            <>
              {/* 1. Dashboard */}
              <NavLink
                to="/dashboard"
                title={sidebarCollapsed ? t('Dashboard') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Home className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('Dashboard')}</span>}
              </NavLink>

              {/* 2. Customers */}
              <NavLink
                to="/customers"
                title={sidebarCollapsed ? t('Customers') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Users className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('Customers')}</span>}
              </NavLink>

              {/* 3. Products */}
              <NavLink
                to="/products"
                title={sidebarCollapsed ? t('Products') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Box className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('Products')}</span>}
              </NavLink>

              {/* 4. Billing Accordion Dropdown (HeroUI Style) */}
              <div className="pt-0.5">
                {sidebarCollapsed ? (
                  <NavLink
                    to="/bills"
                    title={t('Billing')}
                    className={({ isActive }) =>
                      `flex items-center justify-center px-2 py-2.5 rounded-lg border text-sm transition-all ${
                        isShopkeeperBillingActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                  </NavLink>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShopkeeperBillingOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer ${
                        isShopkeeperBillingActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>{t('Billing')}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          shopkeeperBillingOpen ? 'rotate-180' : ''
                        } ${isShopkeeperBillingActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                      />
                    </button>

                    {shopkeeperBillingOpen && (
                      <div className="mt-1 space-y-1 relative pl-7 pr-1">
                        <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                        <NavLink
                          to="/bills"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Bills & Invoices')}
                        </NavLink>

                        <NavLink
                          to="/voice"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Voice Entry')}
                        </NavLink>

                        <NavLink
                          to="/reminders"
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Reminders')}
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Reports */}
              <NavLink
                to="/reports"
                title={sidebarCollapsed ? t('Reports') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <BarChart2 className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('Reports')}</span>}
              </NavLink>

              {/* 6. Subscription (with Pro badge) */}
              <NavLink
                to="/subscription"
                title={sidebarCollapsed ? t('Subscription') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Gem className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span>{t('Subscription')}</span>
                    <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Pro
                    </span>
                  </>
                )}
              </NavLink>

              {/* 7. Settings */}
              <NavLink
                to="/settings"
                title={sidebarCollapsed ? t('Settings') : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    isActive
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('Settings')}</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        {!isAdmin && (
          <div className="p-3 border-t border-gray-100 shrink-0">
            <Link
              to="/contact-support"
              title={sidebarCollapsed ? 'Help & Support' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                location.pathname === '/contact-support'
                  ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
              } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{t('Help')}</span>}
            </Link>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MOBILE / TABLET OFFCANVAS DRAWER (< 1024px)
      ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 transition-transform">
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#093C5D] text-white flex items-center justify-center font-medium text-base shadow-sm">
                  U
                </div>
                <span className="font-medium text-gray-900 text-[16px]">
                  UdharPay {isAdmin && <span className="text-[11px] font-medium text-[#093C5D] bg-[#093C5D]/10 px-1.5 py-0.5 rounded">ADMIN</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {isAdmin ? (
                <>
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>Dashboard</span>
                  </NavLink>

                  <div>
                    <button
                      type="button"
                      onClick={() => setStoresOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                        isStoresActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Store className="w-4 h-4 shrink-0" />
                        <span>Stores</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          storesOpen ? 'rotate-180' : ''
                        } ${isStoresActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                      />
                    </button>

                    {storesOpen && (
                      <div className="mt-1 space-y-1 pl-8 pr-1 relative">
                        <div className="absolute left-6 top-1.5 bottom-2 w-px bg-gray-200" />
                        <NavLink
                          to="/admin/shops"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Store
                        </NavLink>
                        <NavLink
                          to="/admin/bills"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Store Bill
                        </NavLink>
                        <NavLink
                          to="/admin/reports"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Reports
                        </NavLink>
                      </div>
                    )}
                  </div>

                  {/* Subscriptions Accordion Group */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setSubscriptionsOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                        isSubscriptionsActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 shrink-0" />
                        <span>Subscriptions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          LIVE
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            subscriptionsOpen ? 'rotate-180' : ''
                          } ${isSubscriptionsActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                        />
                      </div>
                    </button>

                    {subscriptionsOpen && (
                      <div className="mt-1 space-y-1 relative pl-7 pr-1">
                        <div className="absolute left-[22px] top-1.5 bottom-2 w-px bg-gray-200/80" />

                        <NavLink
                          to="/admin/subscriptions"
                          end
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Billing Receipts
                        </NavLink>


                        <NavLink
                          to="/admin/plans"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          Plans & Pricing
                        </NavLink>
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/admin/health"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 shrink-0" />
                      <span>System Health</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                      LIVE
                    </span>
                  </NavLink>

                  <NavLink
                    to="/admin/broadcasts"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>Broadcasts</span>
                  </NavLink>

                  <NavLink
                    to="/admin/support"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <LifeBuoy className="w-4 h-4 shrink-0" />
                    <span>Support Desk</span>
                  </NavLink>

                  <NavLink
                    to="/admin/coupons"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>Coupons</span>
                  </NavLink>


                  <NavLink
                    to="/admin/audit-logs"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Audit Logs</span>
                  </NavLink>

                  <NavLink
                    to="/admin/settings"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Settings</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>{t('Dashboard')}</span>
                  </NavLink>

                  <NavLink
                    to="/customers"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{t('Customers')}</span>
                  </NavLink>

                  <NavLink
                    to="/products"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Box className="w-4 h-4 shrink-0" />
                    <span>{t('Products')}</span>
                  </NavLink>

                  {/* Billing Accordion in Mobile */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShopkeeperBillingOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                        isShopkeeperBillingActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>{t('Billing')}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                          shopkeeperBillingOpen ? 'rotate-180' : ''
                        } ${isShopkeeperBillingActive ? 'text-[#093C5D]' : 'text-gray-400'}`}
                      />
                    </button>

                    {shopkeeperBillingOpen && (
                      <div className="mt-1 space-y-1 pl-8 pr-1 relative">
                        <div className="absolute left-6 top-1.5 bottom-2 w-px bg-gray-200" />
                        <NavLink
                          to="/bills"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Bills & Invoices')}
                        </NavLink>
                        <NavLink
                          to="/voice"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Voice Entry')}
                        </NavLink>
                        <NavLink
                          to="/reminders"
                          onClick={() => setMobileDrawerOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                            }`
                          }
                        >
                          {t('Reminders')}
                        </NavLink>
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/reports"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <BarChart2 className="w-4 h-4 shrink-0" />
                    <span>{t('Reports')}</span>
                  </NavLink>

                  <NavLink
                    to="/subscription"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Gem className="w-4 h-4 shrink-0" />
                      <span>{t('Subscription')}</span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Pro
                    </span>
                  </NavLink>

                  <NavLink
                    to="/settings"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isActive
                          ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                      }`
                    }
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>{t('Settings')}</span>
                  </NavLink>
                </>
              )}
            </div>

            {!isAdmin && (
              <div className="p-4 border-t border-gray-100 shrink-0">
                <Link
                  to="/contact-support"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    location.pathname === '/contact-support'
                      ? 'bg-[#093C5D]/5 text-[#093C5D] border-[#093C5D]/15 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent font-medium'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{t('Help & Support')}</span>
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* =========================================================================
          MAIN COLUMN (Sticky Navbar + Content Area)
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Top Header Container (Navbar sticks below TopAnnouncementBar if active) */}
        <div
          className="sticky z-30 shrink-0 transition-all duration-150"
          style={{ top: 'var(--top-announcement-height, 0px)' }}
        >
          <header className="h-14 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 shrink-0">
          {/* Left Side: Sidebar Trigger + Vertical Divider + Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Desktop: Rail Collapse Trigger Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              title="Toggle sidebar (Ctrl+B)"
              aria-label="Toggle sidebar collapse"
            >
              <SidebarRailIcon className="w-[18px] h-[18px] text-gray-600" strokeWidth={1.75} />
            </button>

            {/* Mobile / Tablet: Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600" strokeWidth={1.75} />
            </button>

            {/* Subtle Vertical Divider between Toggle Button and Breadcrumb */}
            <div className="hidden lg:block w-px h-4 bg-gray-200 shrink-0 mx-0.5" aria-hidden="true" />

            {/* Breadcrumb Trail (Strictly Aligned) */}
            <div aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 select-none">
              <span className="inline-flex items-center justify-center text-gray-600 shrink-0">
                <BreadcrumbIcon className="w-4 h-4 text-gray-600" strokeWidth={1.75} />
              </span>
              <span className="text-gray-300 text-xs font-normal select-none shrink-0" aria-hidden="true">
                /
              </span>
              <span className="text-gray-900 font-medium text-sm truncate leading-none">
                {breadcrumbTitle}
              </span>
            </div>
          </div>

          {/* Right Side: Language Switcher, Search, Notifications, Separator, Avatar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* 1. Quick Search Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-gray-200 rounded-full text-gray-600 hover:text-gray-900 bg-transparent active:bg-gray-100 hover:bg-gray-100 transition-colors duration-150 cursor-pointer shrink-0"
              title="Quick Search (Ctrl+K)"
              aria-label="Quick search"
            >
              <Search className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-gray-600" strokeWidth={1.75} />
            </button>

            {/* 2. Notification Bell Button & Popover */}
            <div className="relative flex items-center justify-center" ref={notificationMenuRef}>
              <button
                type="button"
                onClick={handleNotificationClick}
                className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-gray-200 rounded-full text-gray-600 hover:text-gray-900 bg-transparent active:bg-gray-100 hover:bg-gray-100 transition-colors duration-150 cursor-pointer shrink-0"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-gray-600" strokeWidth={1.75} />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {notificationOpen && (
                <div className="fixed sm:absolute right-4 sm:right-0 top-14 sm:top-11 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-gray-100 shadow-xl shadow-gray-200/70 rounded-2xl p-0 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">{t('Notifications')}</h4>
                      {notificationCount > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#093C5D]/10 text-[#093C5D]">
                          {notificationCount} {t('new')}
                        </span>
                      )}
                    </div>
                    {notifications.some((n) => !n.read) && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-[#093C5D] hover:underline cursor-pointer"
                      >
                        {t('Mark all read')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">{t('No new notifications')}</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => !notif.read && markAsRead(notif._id)}
                          className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notif.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {notif.type === 'ADMIN_NOTICE' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#093C5D]/10 text-[#093C5D] shrink-0">
                                  Official
                                </span>
                              )}
                              <p className="text-xs font-semibold text-gray-900 truncate">{notif.title}</p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-[#093C5D] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs font-medium text-[#093C5D] hover:underline"
                    >
                      {t('View all notifications →')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="h-4 sm:h-5 w-px bg-gray-200 mx-1 sm:mx-1.5 self-center shrink-0" />

            {/* 3. User Avatar & Floating Popover Menu */}
            <div className="relative flex items-center justify-center shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 shrink-0 ${
                  hasProfileImage && !profileImageError
                    ? 'border border-gray-200 hover:border-gray-300 hover:ring-2 hover:ring-gray-200/60 overflow-hidden'
                    : 'border border-transparent hover:border-gray-200 text-gray-600 hover:text-gray-900 bg-transparent active:bg-gray-100 hover:bg-gray-100'
                }`}
                aria-label="User account menu"
                aria-expanded={profileDropdownOpen}
                title={user?.name || 'Account'}
              >
                {hasProfileImage && !profileImageError ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt={user?.name || 'Profile'}
                    onError={() => setProfileImageError(true)}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-gray-600" strokeWidth={1.75} />
                )}
              </button>

              {/* Popover Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-11 w-48 sm:w-52 bg-white border border-gray-100 shadow-xl shadow-gray-200/70 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1 flex items-center gap-2.5">
                    {hasProfileImage && !profileImageError ? (
                      <img
                        src={getImageUrl(user.profileImage)}
                        alt={user?.name || 'Profile'}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 border border-gray-200/60">
                        <User className="w-4 h-4 text-gray-600" strokeWidth={1.75} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {user?.name || (isAdmin ? 'Administrator' : 'Shopkeeper')}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate font-medium">
                        {user?.email || 'user@udharpay.com'}
                      </p>
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="p-1 mb-1">
                      <Link
                        to="/subscription"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 p-2 bg-[#093C5D] text-white hover:bg-[#082a42] rounded-xl transition-colors group"
                      >
                        <Gem className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                        <div>
                          <p className="text-xs font-medium leading-tight">{t('Upgrade Plan')}</p>
                          <p className="text-[10px] text-white/80 leading-tight mt-0.5">{t('Get extra benefits')}</p>
                        </div>
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <User className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>{t('Account')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(isAdmin ? '/admin/settings' : '/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>{t('Settings')}</span>
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{t('Log out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

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
                    {t('Your recent payment could not be processed. Please check your bank or payment method to avoid service interruption.')}
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

          <Outlet />
        </main>
      </div>
    </div>

      {/* =========================================================================
          QUICK SEARCH COMMAND PALETTE MODAL (Ctrl+K / Cmd+K)
      ========================================================================= */}
      <QuickSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        isAdmin={isAdmin}
      />

      {/* =========================================================================
          LOGOUT CONFIRMATION MODAL
      ========================================================================= */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setLogoutModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center z-10 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4 border border-red-100">
              <LogOut className="w-6 h-6 ml-0.5" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('Logout')}</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">
              {t('Are you sure you want to log out?')}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={executeLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
              >
                {t('Yes, Logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUSPENDED ACCOUNT REAL-TIME MODAL
      ========================================================================= */}
      <SuspendedAccountModal
        isOpen={suspensionData.isOpen}
        reason={suspensionData.reason}
        onLogout={handleSuspendedLogout}
      />
    </div>
  );
};

export default React.memo(MainLayout);
