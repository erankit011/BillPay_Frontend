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
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col h-screen bg-white md:w-[220px] min-[1440px]:w-[240px] fixed left-0 top-0 border-r border-gray-100 z-50">
        {/* Brand - same height as header h-16, aligned */}
        <div className="h-[64px] min-[1440px]:h-[72px] flex items-center px-5 min-[1440px]:px-7 border-b border-gray-100 flex-shrink-0">
          <span className="text-[22px] min-[1440px]:text-[24px] font-semibold tracking-tight text-[#093C5D] select-none cursor-default">UdharPay<span className="inline-block w-[7px] h-[7px] min-[1440px]:w-2 min-[1440px]:h-2 rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
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
            to="/settings"
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
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <span className="text-[20px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[6px] h-[6px] rounded-full bg-[#2ECC71] ml-[2px] mb-[2px] align-baseline"></span></span>
              <button
                onClick={closeSidebar}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all"
                aria-label="Close menu"
              >
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${isActive
                        ? 'bg-[#093C5D] text-white font-medium shadow-sm shadow-[#093C5D]/20'
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
                  to="/settings"
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

      <header className="fixed top-0 right-0 left-0 md:left-[220px] min-[1440px]:left-[240px] h-[64px] min-[1440px]:h-[72px] bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 md:px-6 lg:px-8 min-[1440px]:px-12">
        {/* Left Side - Hamburger & Page Title */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button (Mobile Only) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-full transition-all active:scale-90 hover:bg-gray-50 flex items-center justify-center text-gray-700"
              aria-label="Open menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
                <span className="w-full h-0.5 bg-current rounded-full"></span>
                <span className="w-3/4 h-0.5 bg-current rounded-full"></span>
                <span className="w-full h-0.5 bg-current rounded-full"></span>
              </div>
            </button>
          )}

          {/* Page Title (Desktop) & Logo (Mobile) */}
          <div className="relative md:hidden flex items-center">
            <span className="text-[18px] font-semibold tracking-tight text-[#093C5D] select-none">UdharPay<span className="inline-block w-[5px] h-[5px] rounded-full bg-[#2ECC71] ml-[1px] mb-[2px] align-baseline"></span></span>
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
              className="cursor-pointer border border-gray-200 relative p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
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
                <div className="fixed sm:absolute left-0 right-0 sm:left-auto top-14 sm:top-full sm:right-0 sm:mt-3 w-full sm:w-96 sm:max-w-md bg-white sm:rounded-2xl sm:border-b border-gray-200 z-40 max-h-[calc(100vh-3.5rem)] sm:max-h-[500px] flex flex-col animate-fade-in">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
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
                        <p className="text-base text-gray-700 font-semibold mb-1">No notifications</p>
                        <p className="text-sm text-gray-500">You're all caught up!</p>
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
                    <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-gray-50">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="block text-center text-sm text-[#093C5D] font-semibold hover:text-[#082a42] active:scale-95 transition-all py-2 rounded-lg hover:bg-white"
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden active:scale-95 cursor-pointer ring-1 ring-gray-200">
                <img
                  src={`${BASE_URL}${user.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#093C5D]/10 text-[#093C5D] flex items-center justify-center font-semibold text-sm sm:text-base ring-1 ring-[#093C5D]/20">
                {getInitials(user?.name)}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-[220px] min-[1440px]:ml-[240px] pt-[88px] md:pt-[96px] lg:pt-[104px] min-[1440px]:pt-[120px] px-4 md:px-6 lg:px-8 min-[1440px]:px-12 pb-6 md:pb-8 lg:pb-10 min-[1440px]:pb-12 min-h-screen overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
