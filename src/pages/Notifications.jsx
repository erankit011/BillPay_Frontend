import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const notificationsData = res.data?.data || [];
      const mappedNotifications = notificationsData.map(notif => ({
        ...notif,
        read: notif.isRead
      }));
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'PAYMENT': return '💰';
      case 'CUSTOMER': return '👤';
      case 'BILL': return '📄';
      case 'REMINDER': return '🔔';
      case 'UDHAR': return '💳';
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

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 flex items-center gap-2">
            {t('All Notifications')}
            {unreadCount > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base font-medium">
            {notifications.length} total notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="cursor-pointer flex items-center gap-2 w-full md:w-auto px-5 md:px-6 lg:px-7 py-2.5 md:py-3 lg:py-3.5 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors active:scale-95"
          >
            <CheckCheck className="w-5 h-5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl p-8 md:p-10 lg:p-12 text-center border border-gray-200">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <Bell className="w-8 h-8 md:w-10 md:h-10 text-gray-400" strokeWidth={2} />
          </div>
          <p className="text-base md:text-lg text-gray-700 font-semibold mb-1">No notifications</p>
          <p className="text-gray-500 text-sm md:text-base font-medium">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3 md:gap-4 lg:gap-5">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => !notification.read && markAsRead(notification._id)}
              className={`cursor-pointer bg-white rounded-xl p-4 md:p-5 border transition-all hover:shadow-md active:scale-[0.99] ${
                !notification.read 
                  ? 'border-indigo-200 bg-indigo-50/30' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-xl md:text-2xl shadow-sm">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`text-sm md:text-base font-semibold ${
                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.read ? (
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5"></span>
                    ) : (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm md:text-base text-gray-600 mb-2 leading-relaxed font-medium">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <span>{getTimeAgo(notification.createdAt)}</span>
                    <span>•</span>
                    <span className="capitalize">{notification.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
