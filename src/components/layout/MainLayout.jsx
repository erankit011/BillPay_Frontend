import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, Mic, BarChart2, Settings, Bell, Box, Bell as BellIcon, HelpCircle, LogOut, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LanguageSwitcher from '../LanguageSwitcher';

const navItems = [
  { path: '/dashboard', labelKey: 'Dashboard', icon: Home },
  { path: '/customers', labelKey: 'Customers', icon: Users },
  { path: '/products', labelKey: 'Products', icon: Box },
  { path: '/bills', labelKey: 'Billing', icon: FileText },
  { path: '/reminders', labelKey: 'Reminders', icon: BellIcon },
  { path: '/voice', labelKey: 'Voice Entry', icon: Mic },
  { path: '/reports', labelKey: 'Reports', icon: BarChart2 },
  { path: '/settings', labelKey: 'Settings', icon: Settings },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (logoutModalOpen || sidebarOpen || notificationOpen) {
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
  }, [logoutModalOpen, sidebarOpen, notificationOpen]);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const BASE_URL = API_URL.replace('/api/v1', '');

  // Fetch notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        // Backend sends: { success: true, data: { count: 3 }, message: '...' }
        const count = res.data?.data?.count || res.data?.count || 0;
        setNotificationCount(count);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Set to 0 if API fails - no mock data
        setNotificationCount(0);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notification list when panel opens
  const fetchNotificationList = async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      // Backend now sends: { success: true, data: { data: [...], totalCount: ... }, message: '...' }
      const notificationsData = res.data?.data?.data || [];

      // Map backend isRead to frontend read
      const mappedNotifications = notificationsData.map(notif => ({
        ...notif,
        read: notif.isRead
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Failed to fetch notification list:', error);
      // Don't show mock data - show empty state instead
      setNotifications([]);
    }
  };

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
    if (!notificationOpen) {
      fetchNotificationList();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setNotificationCount(Math.max(0, notificationCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PAYMENT': return '💰';
      case 'CUSTOMER': return '👤';
      case 'BILL': return '📄';
      case 'REMINDER': return '🔔';
      default: return '📢';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const executeLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      dispatch(logout());
      setLogoutModalOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : parts[0].substring(0, 2);
  };

  const closeSidebar = () => setSidebarOpen(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col h-screen bg-white lg:w-[220px] min-[1440px]:w-[240px] fixed left-0 top-0 border-r border-gray-100 z-50">
        {/* Brand - same height as header h-14, aligned */}
        <div className="h-14 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
          <span className="text-[22px] font-semibold tracking-tight text-[#093C5D] select-none cursor-default flex items-center">UdharPay<span className="inline-block w-[7px] h-[7px] rounded-full bg-[#2ECC71] ml-[2px]"></span></span>
        </div>

        {/* Links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pt-10 pb-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${isActive
                  ? 'bg-[#093C5D] text-white font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-4 py-4 border-t border-gray-100 flex-shrink-0 mt-auto">
          <Link
            to="/contact-support"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all font-medium border border-gray-200/60"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">{t('Support')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t('Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-fade-in"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-white/40 z-[110] transform transition-transform duration-300 ease-out rounded-r-xl shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="flex flex-col h-full">
            {/* Header with Close Button - Same height and padding as main header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
              <span className="text-[22px] font-semibold tracking-tight text-[#093C5D] select-none flex items-center">UdharPay<span className="inline-block w-[7px] h-[7px] rounded-full bg-[#2ECC71] ml-[2px]"></span></span>
              <button
                onClick={closeSidebar}
                className="p-1.5 -mr-1.5 flex items-center justify-center rounded-full lg:hover:bg-gray-100 active:bg-gray-200 transition-all text-gray-500"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 flex flex-col px-6 pt-8 pb-8 overflow-y-auto">
              {/* Links */}
              <nav className="flex-1 flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 ${isActive
                        ? 'bg-[#093C5D] text-white font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{t(item.labelKey)}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Footer */}
              <div className="mt-auto flex flex-col gap-2">
                <Link
                  to="/contact-support"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-[#093C5D] transition-colors font-medium"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm">{t('Help')}</span>
                </Link>
                <button
                  onClick={() => {
                    closeSidebar();
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">{t('Logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <header className="fixed top-0 right-0 left-0 lg:left-[220px] min-[1440px]:left-[240px] h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 min-[1440px]:px-10">
        {/* Left Side - Hamburger & Page Title */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button (Mobile Only) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 -ml-1 border border-transparent hover:border-gray-200 rounded-full transition-colors bg-transparent active:bg-gray-100 hover:bg-gray-100 flex items-center justify-center text-gray-700"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6h16M4 12h10M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>


        {/* Right Side - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Notification */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleNotificationClick}
              className="cursor-pointer relative w-7 h-7 sm:w-9 sm:h-9 text-gray-600 border border-transparent hover:border-gray-200 rounded-full bg-transparent active:bg-gray-100 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center flex-shrink-0"
              aria-label="Notifications"
            >
              <div className="relative flex items-center justify-center">
                <Bell className="w-[22px] h-[22px] sm:w-5 sm:h-5" strokeWidth={1.5} />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                  </span>
                )}
              </div>
            </button>

            {/* Notification Dropdown Panel */}
            {notificationOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-30 bg-transparent"
                  onClick={() => setNotificationOpen(false)}
                />

                {/* Panel - Mobile: Full width from top, Desktop: Dropdown */}
                <div className="fixed sm:absolute left-0 right-0 sm:left-auto top-14 sm:top-[calc(100%+4px)] sm:right-0 w-full sm:w-[380px] bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-lg shadow-black/5 z-40 max-h-[calc(100vh-3.5rem)] sm:max-h-[500px] flex flex-col animate-fade-in origin-top-right">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{t("Notifications")}</h3>
                      {notificationCount > 0 && (
                        <span className="bg-[#E5E7EB] text-[#082a42] text-xs font-bold px-2 py-0.5 rounded-full">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#093C5D] font-semibold hover:text-[#082a42] transition-colors active:scale-95 px-2 py-1"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bell className="w-8 h-8 text-gray-400" strokeWidth={2} />
                        </div>
                        <p className="text-base text-gray-700 font-semibold mb-1">{t("No notifications")}</p>
                        <p className="text-sm text-gray-500">{t("You're all caught up!")}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => !notification.read && markAsRead(notification._id)}
                            className={`p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer ${!notification.read ? 'bg-[#F5F5F5]/50' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#E5E7EB] to-[#F5F5F5] flex items-center justify-center text-xl shadow-sm">
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className={`text-sm font-semibold leading-snug ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-[#093C5D] rounded-full flex-shrink-0 mt-1.5"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 font-medium">
                                  {getTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="block w-full text-center text-sm font-semibold text-[#093C5D] hover:text-[#082a42] bg-[#093C5D]/5 hover:bg-[#093C5D]/10 py-2.5 rounded-xl transition-colors"
                      >
                        {t('View all notifications →')}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="h-5 w-[1px] bg-gray-200 mx-1 flex-shrink-0"></div>

          {/* Profile */}
          <Link
            to="/profile"
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-transparent active:scale-95 active:bg-gray-100 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex-shrink-0 p-[2px]"
          >
            {/* Avatar */}
            {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
              <img
                src={getImageUrl(user.profileImage)}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-[22px] h-[22px] sm:w-5 sm:h-5 text-gray-500" strokeWidth={1.5} />
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-[220px] min-[1440px]:ml-[240px] pt-[80px] px-4 md:px-6 lg:px-8 min-[1440px]:px-10 pb-6 md:pb-8 lg:pb-10 min-[1440px]:pb-12 min-h-screen overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => setLogoutModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <LogOut className="w-6 h-6 text-red-600 ml-0.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Logout')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to log out?')}
                </p>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-center w-full mt-2">
                  <button
                    onClick={() => setLogoutModalOpen(false)}
                    className="cursor-pointer w-full sm:flex-1 px-4 py-2.5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={executeLogout}
                    className="cursor-pointer w-full sm:flex-1 px-4 py-2.5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 flex items-center justify-center"
                  >
                    {t('Yes, Logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
