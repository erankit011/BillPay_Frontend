import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, Mic, BarChart2, Settings, Bell, Box, Bell as BellIcon, HelpCircle, LogOut } from 'lucide-react';
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
      const res = await api.get('/notifications');
      // Backend sends: { success: true, data: [...], message: '...' }
      const notificationsData = res.data?.data || [];

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

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      dispatch(logout());
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

  return (
    <div className="flex min-h-screen glass-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col h-screen bg-white md:w-[220px] min-[1440px]:w-[240px] fixed left-0 top-0 border-r border-gray-200 z-50">
        {/* Brand - same height as header h-16, aligned */}
        <div className="h-[64px] min-[1440px]:h-[72px] flex items-center px-4 md:px-6 min-[1440px]:px-12 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">BakiPay</h1>
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-400 rounded-full"></span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 pt-10 pb-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 transition-all duration-300 active:scale-95 ${isActive
                  ? 'text-indigo-600 bg-indigo-600/10 border-indigo-600 font-semibold hover:translate-x-1'
                  : 'text-gray-600 border-transparent hover:translate-x-1 hover:text-indigo-600 font-medium'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-1 px-3 py-3 border-t border-gray-200 flex-shrink-0">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-medium"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">{t('Help')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">{t('Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-white/40 z-50 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="flex flex-col h-full">
            {/* Header with Close Button - Same height and padding as main header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 active:bg-gray-200"
                aria-label="Close menu"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 rotate-45 translate-y-0"></span>
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -rotate-45 translate-y-0"></span>
                  </div>
                </div>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 flex flex-col px-6 pt-10 pb-6">
              {/* Links */}
              <nav className="flex-1 flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 transition-all duration-300 active:scale-95 ${isActive
                        ? 'text-indigo-600 bg-indigo-600/10 border-indigo-600 font-semibold hover:translate-x-1'
                        : 'text-gray-600 border-transparent hover:translate-x-1 hover:text-indigo-600 font-medium'
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
                  to="/settings"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium"
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

      <header className="fixed top-0 right-0 left-0 md:left-[220px] min-[1440px]:left-[240px] h-[64px] min-[1440px]:h-[72px] bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 md:px-6 lg:px-8 min-[1440px]:px-12">
        {/* Left Side - Hamburger (Mobile) / Greeting (Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Menu Button (Mobile Only) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-full transition-all active:scale-90 active:bg-gray-100 flex items-center justify-center"
              aria-label="Open menu"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-2"></span>
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-px"></span>
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 translate-y-2"></span>
                </div>
              </div>
            </button>
          )}

          {/* BakiPay Logo - Mobile Only (with gradient underline) */}
          <div className="relative md:hidden">
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-600 tracking-tight">BakiPay</h1>
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-400 rounded-full"></span>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Notification */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="cursor-pointer relative p-1.5 sm:p-2.5 text-gray-600 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center border border-transparent"
              aria-label="Notifications"
            >
              <Bell className="w-5 sm:w-[22px] h-5 sm:h-[22px]" strokeWidth={2} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-2 sm:right-2.5 flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-red-500 border border-white"></span>
                </span>
              )}
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
                <div className="fixed sm:absolute left-0 right-0 sm:left-auto top-14 sm:top-full sm:right-0 sm:mt-2 w-full sm:w-96 sm:max-w-md bg-white sm:rounded-2xl shadow-2xl sm:shadow-xl border-t sm:border border-gray-200 z-40 max-h-[calc(100vh-3.5rem)] sm:max-h-[500px] flex flex-col animate-fade-in">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      {notificationCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 transition-colors active:scale-95 px-2 py-1"
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
                        <p className="text-base text-gray-700 font-semibold mb-1">No notifications</p>
                        <p className="text-sm text-gray-500">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => !notification.read && markAsRead(notification._id)}
                            className={`p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer ${!notification.read ? 'bg-indigo-50/50' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-xl shadow-sm">
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
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5"></span>
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
                    <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-gray-50">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="block text-center text-sm text-indigo-600 font-semibold hover:text-indigo-700 active:scale-95 transition-all py-2 rounded-lg hover:bg-white"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <Link to="/profile" className="flex items-center gap-2 sm:gap-3 group">
            {/* User Info (Desktop only) */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-medium text-gray-400 tracking-wider">
                {t('Welcome back')}
              </span>
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.name || 'User'}
              </span>
            </div>

            {/* Avatar */}
            {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
              <div className="w-8 h-8 sm:w-10 h-10 rounded-full p-[1.5px] sm:p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 active:scale-95 flex items-center justify-center cursor-pointer">
                <div className="w-full h-full rounded-full overflow-hidden border border-white bg-white">
                  <img
                    src={`${BASE_URL}${user.profileImage}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-semibold text-xs sm:text-xl border-2 border-white">
                {getInitials(user?.name)}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-[220px] min-[1440px]:ml-[240px] pt-[88px] md:pt-[96px] lg:pt-[104px] min-[1440px]:pt-[120px] px-4 md:px-6 lg:px-8 min-[1440px]:px-12 pb-6 md:pb-8 lg:pb-10 min-[1440px]:pb-12 min-h-screen w-full">
        <div className="max-w-[1440px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
